/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { logLevel } from '@nestjs/microservices/external/kafka.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(Number(process.env.NOTIFICATIONS_PORT ?? 3005));
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:19092')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  await app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.KAFKA_CLIENT_ID_NOTIFS ?? 'notifications-service',
        brokers,
        connectionTimeout: 5_000,
        authenticationTimeout: 5_000,
        retry: {
          retries: 10,
          initialRetryTime: 300,
          factor: 0.2,
          multiplier: 2,
          maxRetryTime: 60_000,
        },
        logLevel: logLevel.INFO,
      },
      consumer: {
        groupId: process.env.KAFKA_GROUP_NOTIFS ?? 'notifications-consumer',
        sessionTimeout: 30_000,
      },
    },
  });
  await app.startAllMicroservices();
  Logger.log(`✅ Notifications microservice connected to RMQ.`);
}

bootstrap();
