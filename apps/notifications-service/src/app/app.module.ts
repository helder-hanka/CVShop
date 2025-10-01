import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailerController } from './mailer/mailer.controller';
import { MailerService } from './mailer/mailer.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.SMTP_HOST ?? 'localhost',
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 1025,
          secure: process.env.INCLUDE_PASSWORD_IN_EMAIL === 'false',
          auth:
            process.env.SMTP_USER && process.env.SMTP_PASSWORD
              ? {
                  user: process.env.SMTP_USER || 'your_username', // generated ethereal user
                  pass: process.env.SMTP_PASSWORD || 'your_password', // generated ethereal password
                }
              : undefined,
        },
        defaults: {
          from: process.env.EMAIL_FROM ?? 'no-reply@cvshop.com',
        },
      }),
    }),
    MailerModule,
  ],
  controllers: [AppController, MailerController],
  providers: [AppService, MailerService],
})
export class AppModule {}
