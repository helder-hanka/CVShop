/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  // Microservice RMQ
  const rmqUser =
    process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUser],
      queue: 'notifications',
      queueOptions: { durable: true },
    },
  });
  // await app.listen(port);
  await app.startAllMicroservices();
  Logger.log(`✅ Notifications microservice connected to RMQ.`);
}

bootstrap();
