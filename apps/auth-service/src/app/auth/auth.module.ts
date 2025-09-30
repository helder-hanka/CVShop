import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.register({}),
    ClientsModule.register([
      {
        name: 'NOTIFICATION',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
            // `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}` +
            //   `@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`,
          ],
          queue: 'notification',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
