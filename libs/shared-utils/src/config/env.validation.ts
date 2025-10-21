import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3001),

  // DB
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  // Mail
  EMAIL_FROM: Joi.string().email().required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),

  // MailHog for dev
  EMAIL_VERIFY_SECRET: Joi.string().required(),
  EMAIL_VERIFY_TTL: Joi.string().default('24h'),

  // App URL
  AUTH_PUBLIC_URL: Joi.string().uri().required(),
  // KAFKA
  KAFKA_BROKERS: Joi.string().default('localhost:19092'),
  KAFKA_CLIENT_ID_NOTIFS: Joi.string().required(),
  KAFKA_GROUP_NOTIFS: Joi.string().required(),
  KAFKA_CLIENT_ID_AUTH: Joi.string().required(),
});
