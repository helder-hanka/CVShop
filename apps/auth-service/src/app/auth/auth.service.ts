import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateAdminDto,
  CreateAuthDto,
  CreateProfileUsersDto,
  CreateUsersSellerAdminDto,
  TokenRequestDto,
  UpdatePasswordDto,
} from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, LessThan, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import {
  ForgotPasswordDto,
  ForgotPasswordEvent,
  LoginDto,
  resetPasswordDto,
  Role,
  SalesStatus,
  UserSellerRegisteredEvent,
  UserStatus,
} from '@cvshop/shared-dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entities/refresh-token.entity';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TokenResponseDto } from '@cvshop/shared-dto';
import { StorageService } from '../files/storage.service';
import type { Express } from 'express';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(RefreshToken) private tokens: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private resetTokens: Repository<PasswordResetToken>,
    private jwt: JwtService,
    @Inject('NOTIFICATIONS') private readonly notifications: ClientProxy,
    private storage: StorageService
  ) {}

  private emailVerifySecret() {
    return process.env.EMAIL_VERIFY_SECRET ?? 'super_email_verify_secret_dev';
  }
  private emailVerifyExpire() {
    return process.env.EMAIL_VERIFY_VERIFY_TTL ?? '24h';
  }
  private publicUrl() {
    return process.env.AUTH_PUBLIC_URL ?? 'http://localhost:3001';
  }
  private includePasswordInEmail() {
    return (process.env.INCLUDE_PASSWORD_IN_EMAIL ?? 'false') === 'true';
  }

  private accessSecret() {
    return process.env.JWT_ACCESS_SECRET ?? 'super_access_secret_dev';
  }
  private refreshSecret() {
    return process.env.JWT_REFRESH_SECRET ?? 'super_refresh_secret_dev';
  }
  private accessTtl() {
    return process.env.JWT_ACCESS_TTL ?? '15m';
  }
  private resetSecret() {
    return (
      process.env.JWT_PASSWORD_RESET_SECRET ?? 'super_password_reset_secret_dev'
    );
  }
  private refreshTokenTtlMs() {
    const env = process.env.JWT_REFRESH_TTL ?? '7d';
    // simpliste: 7d -> 7 * 24 * 60 * 60 * 1000
    const num = parseInt(env);
    if (env.endsWith('d')) return num * 24 * 60 * 60 * 1000;
    if (env.endsWith('h')) return num * 60 * 60 * 1000;
    if (env.endsWith('m')) return num * 60 * 1000;
    return 7 * 24 * 60 * 60 * 1000;
  }

  async createCustomer(rDto: CreateAuthDto) {
    await this.existingEmail(rDto.email);
    const passwordHash = await bcrypt.hash(rDto.password, 12);
    const user = await this.users.save(
      this.users.create({
        ...rDto,
        password: passwordHash,
        roles: [Role.CUSTOMER],
        emailVerified: false,
        isSuperAdmin: false,
      })
    );

    await this.sendEmailVerification(user.id, user.email, Role.CUSTOMER);

    return {
      success: true,
      message:
        'Account creation successful: Check your email for account validation ',
    };
  }

  async createUsersSellerAdmin(
    adminDto: CreateUsersSellerAdminDto,
    createdByAdminId: string
  ) {
    await this.existingEmail(adminDto.email);
    const isSuperAdmin =
      adminDto.roles.includes(Role.PLATFORM_ADMIN) &&
      adminDto.isSuperAdmin === true;
    const passwordHash = await bcrypt.hash(adminDto.password, 12);
    const user = await this.users.save(
      this.users.create({
        email: adminDto.email,
        password: passwordHash,
        roles: adminDto.roles,
        emailVerified: false,
        isSuperAdmin: isSuperAdmin,
        createdByAdminId,
      })
    );

    await this.sendEmailVerification(
      user.id,
      adminDto.email,
      user.roles[0],
      adminDto.password
    );
    return {
      success: true,
      message:
        'Account creation successful: Check your email for account validation ',
    };
  }

  async me(user: { sub: string; email: string; roles: string[] }) {
    const found = await this.users.findOne({ where: { id: user.sub } });
    if (!found) throw new UnauthorizedException();
    // ➜ expose avatarUrl
    return {
      id: found.id,
      email: found.email,
      roles: found.roles,
      avatarUrl: found.avatarUrl,
    };
  }

  async upSetProfile(
    userId: string,
    file: Express.Multer.File,
    profileDto: CreateProfileUsersDto
  ): Promise<Omit<User, 'password'>> {
    await this.existingEmail(userId);

    const user = await this.users.findOneByOrFail({ id: userId });
    Object.assign(user, profileDto);

    // 1) si fichier envoyé → remplace l’avatar (supprime l’ancien)
    if (file) {
      if (user.avatarKey) await this.storage.deleteByKey(user.avatarKey);
      const { url, key } = await this.storage.saveAvatar(userId, file);
      user.avatarUrl = url;
      (user as any).avatarKey = key;
    }

    return this.users.save(user);
  }
  // get users by id
  async getUserById(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new BadRequestException('User not found');
    const { password, ...rest } = user;
    return rest;
  }

  async bootstrapPlatformAdmin(adminDto: CreateAdminDto) {
    await this.existingEmail(adminDto.email);
    const expected = process.env.ADMIN_BOOTSTRAP_TOKEN ?? '';
    if (!expected || adminDto.token !== expected)
      throw new BadRequestException('Invalid credentials');

    // Bootstrap possible uniquement si aucun admin n'existe
    const countAdmins = await this.users.count({
      where: { roles: ArrayContains([Role.PLATFORM_ADMIN]) },
    });

    if (countAdmins > 0)
      throw new BadRequestException('unable to create admin');

    const passwordHash = await bcrypt.hash(adminDto.password, 12);
    const user = await this.users.save(
      this.users.create({
        email: adminDto.email,
        password: passwordHash,
        roles: [Role.PLATFORM_ADMIN],
        emailVerified: false,
        isSuperAdmin: true,
      })
    );

    await this.sendEmailVerification(
      user.id,
      adminDto.email,
      Role.PLATFORM_ADMIN,
      adminDto.password
    );
    return {
      success: true,
      message:
        'Account creation successful: Check your email for account validation ',
    };
  }

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('Invalid credentials');
    if (user.status === 'SUSPENDED')
      throw new BadRequestException('User is suspended');
    if (user.salesStatus === 'FROZEN')
      throw new BadRequestException('User sales is frozen');
    const pwMatches = await bcrypt.compare(dto.password, user.password);
    if (!pwMatches) throw new BadRequestException('Invalid credentials');
    if (!user.emailVerified)
      throw new BadRequestException('Email not verified');
    return this.issueTokens(
      user.id,
      user.email,
      user.roles,
      user.status,
      user.salesStatus
    );
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    const pwMatches = await bcrypt.compare(
      updatePasswordDto.password,
      user.password
    );
    if (!pwMatches) throw new BadRequestException('Invalid credentials');
    user.password = await bcrypt.hash(updatePasswordDto.newPassword, 12);
    await this.tokens.update({ userId: userId }, { isRevoked: true });
    await this.users.save(user);
    return { success: true, message: 'Password updated successfully' };
  }

  async forgotPassword(
    dto: ForgotPasswordDto
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    // Ne révèle pas l’existence du compte
    if (user) {
      const token = this.resetTokens.create({
        userId: user.id,
        expiresAt: new Date(Date.now() + this.refreshTokenTtlMs()),
        isUsed: false,
      });
      await this.resetTokens.save(token);

      const jwt = await this.jwt.signAsync(
        {
          sub: user.id,
          jti: token.id,
          kind: 'pwd-reset',
        },
        {
          secret: this.resetSecret(),
          expiresIn: process.env.JWT_PASSWORD_RESET_TTL ?? '1h',
        }
      );
      const resetUrl = `${this.publicUrl()}/api/auth/reset-password?token=${encodeURIComponent(
        jwt
      )}`;
      const event: ForgotPasswordEvent = {
        userId: user.id,
        email: user.email,
        resetUrl,
      };
      this.notifications.emit<ForgotPasswordEvent>(
        'user.forgot-password',
        event
      );
    }
    await this.pruneExpiredTokens();
    return { success: true, message: 'Forgot password email sent' };
  }

  async resetPassword(
    resetPw: resetPasswordDto
  ): Promise<{ success: boolean; message: string }> {
    let payload: { sub: string; jti: string; kind: string };

    try {
      payload = await this.jwt.verifyAsync(resetPw.token, {
        secret: this.resetSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.kind !== 'pwd-reset')
      throw new UnauthorizedException('Invalid token');

    const record = await this.resetTokens.findOne({
      where: { id: payload.jti, userId: payload.sub },
    });

    if (!record || record.isUsed || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Token already used or expired');
    }
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    user.password = await bcrypt.hash(resetPw.newPassword, 12);
    await this.users.save(user);

    // Invalide tous les refresh tokens existants (logout partout)
    await this.tokens.update({ userId: user.id }, { isRevoked: true });

    // Marque le reset token comme utilisé
    record.isUsed = true;
    await this.resetTokens.save(record);

    return { success: true, message: 'Password reset successfully' };
  }

  async refreshTokens(token: TokenRequestDto): Promise<TokenResponseDto> {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        roles: Role[];
        jti: string;
        status: UserStatus;
        salesStatus: SalesStatus;
      }>(token.token, {
        secret: this.refreshSecret(),
      });
      const stored = await this.tokens.findOne({
        where: { id: payload.jti, userId: payload.sub },
      });
      if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
        throw new BadRequestException('Invalid token (db)');
      }
      // rotate refresh token
      stored.isRevoked = true;
      await this.tokens.save(stored);
      // on peut aussi supprimer les anciens tokens expirés ici
      // await this.tokens.delete({ id: payload.jti });
      await this.pruneExpiredTokens();
      // issue new tokens
      return this.issueTokens(
        payload.sub,
        payload.email,
        payload.roles,
        payload.status,
        payload.salesStatus
      );
    } catch {
      throw new BadRequestException('Invalid token');
    }
  }

  private async existingEmail(email: string) {
    const exists = await this.users.findOne({ where: { email: email } });
    if (exists) throw new BadRequestException('Email already exists');
  }

  private async sendEmailVerification(
    userId: string,
    email: string,
    role: Role,
    password?: string
  ) {
    const verifyToken = await this.jwt.signAsync(
      { sub: userId, email: email },
      {
        secret: this.emailVerifySecret(),
        expiresIn: this.emailVerifyExpire(),
      }
    );
    const verifyUrl = `${this.publicUrl()}/api/auth/verify-email?token=${encodeURIComponent(
      verifyToken
    )}`;
    // --- publish event to notifications ---
    const event: UserSellerRegisteredEvent = {
      userId: userId,
      email: email,
      role: role,
      verifyUrl,
      ...(this.includePasswordInEmail() ? { plainPassword: password } : {}),
    };
    // fire-and-forget
    this.notifications.emit<UserSellerRegisteredEvent>(
      'users.registered',
      event
    );
  }

  private async issueTokens(
    userId: string,
    email: string,
    roles: Role[],
    status: UserStatus,
    salesStatus: SalesStatus
  ): Promise<TokenResponseDto> {
    const jti = randomUUID();

    const tokenEntity = this.tokens.create({
      id: jti,
      userId,
      expiresAt: new Date(Date.now() + this.refreshTokenTtlMs()),
      isRevoked: false,
    });
    await this.tokens.save(tokenEntity);

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, roles, status, salesStatus },
      { secret: this.accessSecret(), expiresIn: this.accessTtl() }
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email, roles, status, salesStatus, jti },
      {
        secret: this.refreshSecret(),
        expiresIn: this.refreshTokenTtlMs() / 1000,
      }
    );
    return { accessToken, refreshToken };
  }

  async verifyEmail(token: TokenRequestDto) {
    try {
      const payload = await this.jwt.verifyAsync(token.token, {
        secret: this.emailVerifySecret(),
      });
      const user = await this.users.findOne({
        where: { id: payload.sub, email: payload.email },
      });
      if (!user) throw new BadRequestException('Invalid token (user)');
      if (user.emailVerified) return; // already verified

      user.emailVerified = true;
      await this.users.save(user);
      return { success: true, message: 'Email verified successfully' };
    } catch {
      throw new BadRequestException('Invalid token or expired');
    }
  }
  async logout(refreshToken: TokenRequestDto) {
    try {
      const payload = await this.jwt.verifyAsync<{ jti: string; sub: string }>(
        refreshToken.token,
        {
          secret: this.refreshSecret(),
        }
      );
      // await this.tokens.delete({ id: payload.sub });
      await this.tokens.update(
        { id: payload.jti, userId: payload.sub },
        { isRevoked: true }
      );
      return { success: true, message: 'Logged out successfully' };
    } catch {
      return { success: false, message: 'Invalid token' };
    }
  }
  // petite maintenance (optionnel): révoquer tous les refresh expirés
  async pruneExpiredTokens() {
    await this.tokens.delete({ expiresAt: LessThan(new Date()) });
  }
}
