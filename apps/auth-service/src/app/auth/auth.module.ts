import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { StorageService } from '../files/storage.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { logLevel } from 'kafkajs';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, RefreshToken, PasswordResetToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: cfg.get<string>('JWT_ACCESS_TTL') ?? '15m' },
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATIONS',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => {
          const brokers = (
            cfg.get<string>('KAFKA_BROKERS', 'localhost:19092') || ''
          )
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: cfg.get('KAFKA_CLIENT_ID_AUTH', 'auth-service'),
                brokers,
                // ⏱️ timeouts + retries
                connectionTimeout: 5_000,
                authenticationTimeout: 5_000,
                retry: {
                  retries: 8,
                  initialRetryTime: 300, // ms
                  factor: 0.2,
                  multiplier: 2,
                  maxRetryTime: 30_000, // ms
                },
                // 🪵 logs Kafkajs
                logLevel: logLevel.INFO,
              },
              // Producteur uniquement (évite d'ouvrir un consumer par erreur)
              producerOnlyMode: true,
            },
          };
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, StorageService],
  exports: [PassportModule, JwtStrategy],
})
export class AuthModule {}
