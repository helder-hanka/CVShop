import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateAdminDto,
  CreateAuthDto,
  CreateUsersSellerAdminDto,
  TokenRequestDto,
} from './dto/create-auth.dto';
import { LoginDto, TokenResponseDto } from '@cvshop/shared-dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { Role } from '@cvshop/shared-dto';
import { Roles } from './decorators/roles.decorator';
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
  registerSellerAdmin(@Body() createAuthDto: CreateUsersSellerAdminDto) {
    return this.authService.createUsersSellerAdmin(createAuthDto);
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
