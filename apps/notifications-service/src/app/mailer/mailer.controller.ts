import { Controller } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { Role, UserSellerRegisteredEvent } from '@cvshop/shared-dto';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @EventPattern('users.registered')
  async onUserRegistered(@Payload() event: UserSellerRegisteredEvent) {
    const includPwd =
      (process.env.INCLUDE_PASSWORD_IN_EMAIL ?? 'false') === 'true';

    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>Welcome to CVShop!</h2>
    <p>Thank you for registering ${
      event.email
    } as a seller. Please verify your email by clicking the link below:</p>
    <a href="${
      event.verifyUrl
    }" style="display: inline-block; padding: 10px 15px; background-color: #007BFF; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
    ${
      includPwd && event.plainPassword
        ? `<p>Your temporary password is: <strong>${event.plainPassword}</strong></p>`
        : ''
    }
    <p>If you did not register, please ignore this email.</p>
    <p>Best regards,<br/>The CVShop Team</p>
    </div>`;
    await this.mailerService.send(
      event.email,
      'Welcome to CVShop - Verify Your Email',
      html
    );
  }
}
