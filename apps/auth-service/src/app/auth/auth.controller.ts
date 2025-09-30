import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto, TokenResponseDto } from '@cvshop/shared-dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.verifyEmail(token);
  }

  @Post('RefreshToken')
  refreshToken(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken)
      throw new BadRequestException('Refresh token is required');
    return this.authService.refreshTokens(refreshToken);
  }
  @Post('logout')
  logout(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken)
      throw new BadRequestException('Refresh token is required');
    return this.authService.logout(refreshToken);
  }
}
