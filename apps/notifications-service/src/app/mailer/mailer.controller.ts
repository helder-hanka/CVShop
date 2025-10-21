import { Controller, Get, Logger } from '@nestjs/common';
import { MailerService } from './mailer.service';
import {
  ForgotPasswordEvent,
  UserSellerRegisteredEvent,
} from '@cvshop/shared-dto';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class MailerController {
  private readonly logger = new Logger(MailerController.name);
  constructor(private readonly mailerService: MailerService) {}

  @Get('health')
  health() {
    return { status: 'OK', service: 'notification-service' };
  }

  @EventPattern('users.registered')
  async onUserRegistered(@Payload() event: UserSellerRegisteredEvent) {
    const isPwd = (process.env.INCLUDE_PASSWORD_IN_EMAIL ?? 'false') === 'true';
    const e =
      typeof event === 'string'
        ? (JSON.parse(event) as UserSellerRegisteredEvent)
        : event;

    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>Welcome to CVShop!</h2>
    <p>Thank you for registering ${
      e.email
    } as a seller. Please verify your email by clicking the link below:</p>
    <a href="${
      e.verifyUrl
    }" style="display: inline-block; padding: 10px 15px; background-color: #007BFF; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
    ${
      isPwd &&
      e.plainPassword &&
      `<p>Your temporary password is: <strong>${e.plainPassword}</strong></p>`
    }
    <p>If you did not register, please ignore this email.</p>
    <p>Best regards,<br/>The CVShop Team</p>
    </div>`;
    await this.mailerService.send(
      e.email,
      'Welcome to CVShop - Verify Your Email',
      html
    );
    this.logger.log(`user.registered handled for ${e.email}`);
  }

  @EventPattern('user.forgot-password')
  async onForgotPassword(@Payload() event: ForgotPasswordEvent) {
    const e =
      typeof event === 'string'
        ? (JSON.parse(event) as ForgotPasswordEvent)
        : event;

    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif">
      <h2>Password Reset</h2>
      <p>You (or someone else) has requested to reset the password of ${e.email}.</p>
      <p>To continue, click the button below :</p>
      <p><a href="${e.resetUrl}" style="background:#0d6efd;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset my password</a></p>
      <p style="margin-top:16px;font-size:12px;color:#666">If you are not the originator of this request, please ignore this email.</p>
    </div>`;
    await this.mailerService.send(e.email, 'Reset your password', html);
    this.logger.log(`user.forgot-password handled for ${e.email}`);
  }
}
