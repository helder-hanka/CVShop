import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateAdminDto,
  CreateAuthDto,
  CreateProfileUsersDto,
  CreateUsersSellerAdminDto,
  TokenRequestDto,
} from './dto/create-auth.dto';
import { LoginDto, TokenResponseDto } from '@cvshop/shared-dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { Role } from '@cvshop/shared-dto';
import { Roles } from './decorators/roles.decorator';
import { avatarMulterOptions } from '../files/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-customer')
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.createCustomer(createAuthDto);
  }

  @ApiTags('auth')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN)
  @Post('register-seller-admin')
  registerSellerAdmin(
    @Body() createAuthDto: CreateUsersSellerAdminDto,
    @Req() req: any
  ) {
    const currentAdminId = req.user.sub as string;
    return this.authService.createUsersSellerAdmin(
      createAuthDto,
      currentAdminId
    );
  }
  @ApiBody({
    description: 'Profile data',
    type: CreateProfileUsersDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiTags('auth')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CUSTOMER, Role.SELLER, Role.PLATFORM_ADMIN)
  @UseInterceptors(FileInterceptor('avatar', avatarMulterOptions))
  @Post('create-profile')
  createProfileUsers(
    @Body() profileDto: CreateProfileUsersDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    const currentUserId = req.user.sub as string;
    return this.authService.upSetProfile(currentUserId, file, profileDto);
  }
  @ApiTags('auth')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CUSTOMER, Role.SELLER, Role.PLATFORM_ADMIN)
  @Get('profile-me')
  getProfile(@Req() req: any) {
    const currentUserId = req.user.sub as string;
    return this.authService.getUserById(currentUserId);
  }
  @Post('bootstrap-platform-admin')
  async bootstrapAdmin(@Body() body: CreateAdminDto) {
    return await this.authService.bootstrapPlatformAdmin(body);
  }
  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query() token: TokenRequestDto) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.verifyEmail(token);
  }

  @Post('RefreshToken')
  refreshToken(@Body() refreshToken: TokenRequestDto) {
    if (!refreshToken)
      throw new BadRequestException('Refresh token is required');
    return this.authService.refreshTokens(refreshToken);
  }
  @Post('logout')
  logout(@Body() refreshToken: TokenRequestDto) {
    if (!refreshToken)
      throw new BadRequestException('Refresh token is required');
    return this.authService.logout(refreshToken);
  }
}
