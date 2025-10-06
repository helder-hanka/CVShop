import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAdminDto, CreateAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, LessThan, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LoginDto, Role, UserSellerRegisteredEvent } from '@cvshop/shared-dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entities/refresh-token.entity';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TokenResponseDto } from '@cvshop/shared-dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(RefreshToken) private tokens: Repository<RefreshToken>,
    private jwt: JwtService,
    @Inject('NOTIFICATIONS') private readonly notifications: ClientProxy
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
  private refreshTokenTtlMs() {
    const env = process.env.JWT_REFRESH_TTL ?? '7d';
    // simpliste: 7d -> 7 * 24 * 60 * 60 * 1000
    const num = parseInt(env);
    if (env.endsWith('d')) return num * 24 * 60 * 60 * 1000;
    if (env.endsWith('h')) return num * 60 * 60 * 1000;
    if (env.endsWith('m')) return num * 60 * 1000;
    return 7 * 24 * 60 * 60 * 1000;
  }

  async register(rDto: CreateAuthDto) {
    await this.existingEmail(rDto.email);

    const role = rDto.roles?.length ? rDto.roles : [Role.CUSTOMER];
    const displayPassword =
      role.includes(Role.PLATFORM_ADMIN) || role.includes(Role.SELLER)
        ? rDto.password
        : '';

    const passwordHash = await bcrypt.hash(rDto.password, 12);
    const user = await this.users.save(
      this.users.create({
        ...rDto,
        password: passwordHash,
        roles: role,
      })
    );

    const newUser = {
      ...user,
      password: displayPassword,
    };

    await this.sendEmailVerification(newUser);

    return {
      success: true,
      message:
        'Account creation successful: Check your email for account validation ',
    };
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

    const newUser = {
      ...user,
      password: '',
    };

    await this.sendEmailVerification(newUser);
    return {
      success: true,
      message:
        'Account creation successful: Check your email for account validation ',
    };
  }

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('Invalid credentials');
    const pwMatches = await bcrypt.compare(dto.password, user.password);
    if (!pwMatches) throw new BadRequestException('Invalid credentials');
    if (!user.emailVerified)
      throw new BadRequestException('Email not verified');
    return this.issueTokens(user.id, user.email, user.roles);
  }

  async refreshTokens(token: string): Promise<TokenResponseDto> {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        roles: string[];
        jti: string;
      }>(token, {
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
      return this.issueTokens(payload.sub, payload.email, payload.roles);
    } catch {
      throw new BadRequestException('Invalid token');
    }
  }

  private async existingEmail(email: string) {
    const exists = await this.users.findOne({ where: { email: email } });
    if (exists) throw new BadRequestException('Email already exists');
  }

  private async sendEmailVerification(user: User) {
    const verifyToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
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
      userId: user.id,
      email: user.email,
      role: user.roles[0],
      verifyUrl,
      ...(this.includePasswordInEmail()
        ? { plainPassword: user.password }
        : {}),
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
    roles: string[]
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
      { sub: userId, email, roles },
      { secret: this.accessSecret(), expiresIn: this.accessTtl() }
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email, roles, jti },
      {
        secret: this.refreshSecret(),
        expiresIn: this.refreshTokenTtlMs() / 1000,
      }
    );
    return { accessToken, refreshToken };
  }

  async verifyEmail(token: string) {
    try {
      const payload = await this.jwt.verifyAsync(token, {
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
  async logout(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ jti: string; sub: string }>(
        refreshToken,
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
