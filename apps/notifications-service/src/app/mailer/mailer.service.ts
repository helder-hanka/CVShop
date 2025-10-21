import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter = require('nodemailer').createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 1025,
    secure: false, // true for 465, false for other ports
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  });
  async send(to: string, subject: string, html: string) {
    try {
      const fromEmail = process.env.EMAIL_FROM ?? 'no-reply@cvshop.com';
      const info = await this.transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent: ${info.messageId} to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
    }
  }
}
