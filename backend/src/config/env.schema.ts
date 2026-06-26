import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().min(1),
  APP_VERSION: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().startsWith('/').default('/api/v1'),

  FRONTEND_URL: z.string().min(1),
  CORS_CREDENTIALS: z
    .string()
    .transform((v) => v === 'true')
    .pipe(z.boolean()),

  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().min(1),

  REDIS_URL: z.string().optional().default(''),

  QUEUE_PREFIX: z.string().min(1),
  QUEUE_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  QUEUE_BACKOFF_DELAY_MS: z.coerce.number().int().positive().default(5000),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1),
  JWT_ISSUER: z.string().min(1).default('hr-shakya'),
  JWT_AUDIENCE: z.string().min(1).default('hr-shakya-api'),

  FIELD_ENCRYPTION_KEY: z.string().min(32),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  AUTH_MAX_FAILED_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
  AUTH_LOCKOUT_DURATION_MS: z.coerce.number().int().positive().default(900000),
  AUTH_REMEMBER_ME_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  AUTH_USE_HTTP_ONLY_COOKIES: z
    .string()
    .transform((v) => v === 'true')
    .pipe(z.boolean()),
  AUTH_COOKIE_SECURE: z
    .string()
    .transform((v) => v === 'true')
    .pipe(z.boolean()),
  AUTH_COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  AUTH_LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  AUTH_PERMISSION_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(900),

  SEED_COMPANY_NAME: z.string().min(1).default('HR Shakya'),
  SEED_COMPANY_LEGAL_NAME: z.string().min(1).default('HR Shakya Private Limited'),
  SEED_COMPANY_CODE: z.string().min(2).default('HRS'),
  SEED_COMPANY_EMAIL: z.email().default('admin@hrshakya.com'),
  SEED_COMPANY_PHONE: z.string().min(1).default('+919999999999'),
  SEED_COMPANY_ADDRESS_LINE1: z.string().min(1).default('123 Main Street'),
  SEED_COMPANY_CITY: z.string().min(1).default('Mumbai'),
  SEED_COMPANY_STATE: z.string().min(1).default('Maharashtra'),
  SEED_COMPANY_COUNTRY: z.string().min(1).default('India'),
  SEED_COMPANY_POSTAL_CODE: z.string().min(1).default('400001'),
  SEED_COMPANY_TIMEZONE: z.string().default('Asia/Kolkata'),
  SEED_COMPANY_CURRENCY: z.string().length(3).default('INR'),
  SEED_COMPANY_FISCAL_YEAR_START: z.string().default('04-01'),
  SEED_ADMIN_FIRST_NAME: z.string().min(1).default('Super'),
  SEED_ADMIN_LAST_NAME: z.string().min(1).default('Admin'),
  SEED_ADMIN_EMAIL: z.email().default('superadmin@hrshakya.com'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('SuperAdmin@123'),
  SEED_ADMIN_PHONE: z.string().optional().default(''),

  SUPER_ADMIN_NAME: z.string().min(1).default('Super Admin'),
  SUPER_ADMIN_EMAIL: z.email().default('superadmin@hrshakya.com'),
  SUPER_ADMIN_PASSWORD: z.string().min(8).default('SuperAdmin@123'),
  SUPER_ADMIN_PHONE: z.string().optional().default(''),
  SECURE_TOKEN_EXPIRY_HOURS: z.coerce.number().int().min(1).max(168).default(48),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_FOLDER_PREFIX: z.string().min(1).default('hr-shakya'),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z
    .string()
    .transform((v) => v === 'true')
    .pipe(z.boolean()),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM_NAME: z.string().min(1),
  SMTP_FROM_EMAIL: z.email(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  REQUEST_BODY_LIMIT: z.string().default('10mb'),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  LOG_DIR: z.string().min(1),

  SWAGGER_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .pipe(z.boolean()),
  SWAGGER_PATH: z.string().startsWith('/'),

  UPLOAD_MAX_FILE_SIZE: z.coerce.number().int().positive(),
  UPLOAD_ALLOWED_MIME_TYPES: z.string().min(1),

  SOCKET_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .pipe(z.boolean()),
  SOCKET_PATH: z.string().startsWith('/'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(raw: NodeJS.ProcessEnv): EnvConfig {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    const missingKeys = parsed.error.issues
      .filter((issue) => issue.message.includes('expected string, received undefined'))
      .map((issue) => issue.path.join('.'));
    const deployHint =
      missingKeys.length > 0
        ? `\n\nMissing variables (set in Render → Environment): ${missingKeys.join(', ')}\nSee backend/.env.production.example for the full list.`
        : '';
    throw new Error(`Environment validation failed:\n${formatted}${deployHint}`);
  }

  const data = parsed.data;

  if (data.NODE_ENV === 'production') {
    const weakJwtSecrets = ['change-me-access-secret-min-32-chars-long', 'change-me-refresh-secret-min-32-chars-long'];
    if (weakJwtSecrets.includes(data.JWT_ACCESS_SECRET) || weakJwtSecrets.includes(data.JWT_REFRESH_SECRET)) {
      throw new Error('Environment validation failed: production must not use default JWT secrets');
    }
    if (!data.REDIS_URL?.trim()) {
      throw new Error('Environment validation failed: REDIS_URL is required in production');
    }
    if (!data.AUTH_USE_HTTP_ONLY_COOKIES) {
      throw new Error('Environment validation failed: AUTH_USE_HTTP_ONLY_COOKIES must be true in production');
    }
    if (!data.AUTH_COOKIE_SECURE) {
      throw new Error('Environment validation failed: AUTH_COOKIE_SECURE must be true in production');
    }
  }

  return data;
}
