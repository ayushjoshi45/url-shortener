import { z } from 'zod';
import { logger } from '@user-service/common';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).default('3001'),
  DATABASE_URL: z.string(),
  BASE_URL: z.string(),
  URL_SERVICE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('1d'),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(env: NodeJS.ProcessEnv): EnvConfig {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    logger.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

const env = validateEnv(process.env);

export default env;
