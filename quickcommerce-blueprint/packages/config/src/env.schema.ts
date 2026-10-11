/**
 * QuickCart environment validation (blueprint).
 *
 * Design decisions (see 06-INSTALLER-DEPLOYMENT.md, section "Environment variable validation"):
 * - Every process (api, worker, migrate, cli) calls loadEnv() exactly once, before anything else.
 * - Secrets may be passed directly (FOO) or as a path (FOO_FILE), which is how Docker / Kubernetes
 *   secrets are mounted. Setting both is an error. File contents are read once, trailing newline trimmed.
 * - All problems are collected and printed together, then the process exits with status 78 (EX_CONFIG),
 *   so an operator fixes the whole .env in one pass instead of one variable per restart.
 * - Values are coerced from strings to their typed form here; nothing else in the codebase reads process.env.
 *
 * This file is part of a blueprint. It describes the intended implementation and has not been run in production.
 */
import { readFileSync, statSync } from 'node:fs';
import { z } from 'zod';

/* -------------------------------------------------------------------------------------------------
 * Secret keys: these accept the *_FILE form and are redacted by redactEnv().
 * ------------------------------------------------------------------------------------------------- */
export const SECRET_KEYS = [
  'DATABASE_URL',
  'DATABASE_PLATFORM_URL',
  'DATABASE_MIGRATION_URL',
  'DATABASE_READ_URL',
  'REDIS_URL',
  'REDIS_CACHE_URL',
  'MEILI_MASTER_KEY',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'JWT_SECRET',
  'JWT_SECRET_PREVIOUS',
  'COOKIE_SECRET',
  'DATA_ENCRYPTION_KEY',
  'DATA_ENCRYPTION_KEY_PREVIOUS',
  'INSTALL_TOKEN',
  'SMTP_URL',
] as const;

export type SecretKey = (typeof SECRET_KEYS)[number];

const FILE_SUFFIX = '_FILE';
const MIN_SECRET_LENGTH = 32;
/** 32 random bytes encoded as base64url without padding is 43 characters. */
const MIN_INSTALL_TOKEN_LENGTH = 43;

/* -------------------------------------------------------------------------------------------------
 * Reusable field helpers. Environment values are always strings; empty strings mean "unset".
 * ------------------------------------------------------------------------------------------------- */

/** Treats "" and whitespace-only values as undefined so `FOO=` in a .env file means "not set". */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const str = () => z.preprocess(emptyToUndefined, z.string().trim());
const optionalStr = () => z.preprocess(emptyToUndefined, z.string().trim().optional());

/** Strict boolean parsing. z.coerce.boolean() would turn "false" into true, so it is not used. */
const bool = (defaultValue: boolean) =>
  z.preprocess(
    emptyToUndefined,
    z
      .enum(['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'], {
        errorMap: () => ({ message: 'must be one of true|false|1|0|yes|no|on|off' }),
      })
      .default(defaultValue ? 'true' : 'false')
      .transform((v) => v === 'true' || v === '1' || v === 'yes' || v === 'on'),
  );

const int = (defaultValue: number, min: number, max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ invalid_type_error: 'must be an integer' })
      .int('must be an integer')
      .min(min, `must be >= ${min}`)
      .max(max, `must be <= ${max}`)
      .default(defaultValue),
  );

const port = (defaultValue: number) => int(defaultValue, 1, 65535);

/** Absolute URL whose protocol is in the allowed list. */
const url = (protocols: readonly string[]) =>
  str().pipe(
    z
      .string()
      .url('must be an absolute URL')
      .refine((value) => protocols.includes(new URL(value).protocol), {
        message: `protocol must be one of ${protocols.join(', ')}`,
      }),
  );

const optionalUrl = (protocols: readonly string[]) =>
  z.preprocess(emptyToUndefined, url(protocols).optional());

/** Comma-separated list, trimmed, empty items removed. */
const list = (defaultValue: string) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .default(defaultValue)
      .transform((value) =>
        value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      ),
  );

const HOSTNAME_RE =
  /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/;

const hostname = () =>
  str()
    .transform((v) => v.toLowerCase())
    .pipe(z.string().regex(HOSTNAME_RE, 'must be a lowercase DNS hostname without scheme or port'));

const POSTGRES_PROTOCOLS = ['postgres:', 'postgresql:'] as const;
const REDIS_PROTOCOLS = ['redis:', 'rediss:'] as const;
const HTTP_PROTOCOLS = ['http:', 'https:'] as const;

/* -------------------------------------------------------------------------------------------------
 * Base schema: per-variable types, coercion and defaults.
 * ------------------------------------------------------------------------------------------------- */
const baseSchema = z.object({
  // Runtime
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['development', 'test', 'production']).default('production'),
  ),
  APP_ROLE: z.preprocess(emptyToUndefined, z.enum(['api', 'worker', 'migrate', 'cli']).default('api')),
  LOG_LEVEL: z.preprocess(
    emptyToUndefined,
    z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  ),
  HOST: z.preprocess(emptyToUndefined, z.string().default('0.0.0.0')),
  PORT: port(3000),
  INTERNAL_PORT: port(9464),
  PUBLIC_BASE_URL: url(HTTP_PROTOCOLS),
  PLATFORM_ROOT_DOMAIN: hostname(),
  TRUST_PROXY: z.preprocess(emptyToUndefined, z.string().default('loopback,uniquelocal')),
  CORS_ALLOWED_ORIGINS: list(''),
  SHUTDOWN_GRACE_SECONDS: int(25, 1, 300),

  // PostgreSQL
  DATABASE_URL: url(POSTGRES_PROTOCOLS),
  DATABASE_PLATFORM_URL: url(POSTGRES_PROTOCOLS),
  DATABASE_MIGRATION_URL: optionalUrl(POSTGRES_PROTOCOLS),
  DATABASE_READ_URL: optionalUrl(POSTGRES_PROTOCOLS),
  DATABASE_POOL_MAX: int(10, 1, 200),
  DATABASE_STATEMENT_TIMEOUT_MS: int(5000, 100, 600_000),
  DATABASE_IDLE_IN_TX_TIMEOUT_MS: int(10_000, 1000, 600_000),
  DATABASE_SSL_MODE: z.preprocess(
    emptyToUndefined,
    z.enum(['disable', 'require', 'verify-full']).default('disable'),
  ),
  DATABASE_SSL_CA_FILE: optionalStr(),

  // Redis
  REDIS_URL: url(REDIS_PROTOCOLS),
  REDIS_CACHE_URL: optionalUrl(REDIS_PROTOCOLS),
  REDIS_KEY_PREFIX: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^[a-z0-9:_-]{1,32}$/, 'must match [a-z0-9:_-]{1,32}')
      .default('qc:'),
  ),

  // Meilisearch
  MEILI_URL: url(HTTP_PROTOCOLS),
  MEILI_MASTER_KEY: str().pipe(z.string().min(16, 'must be at least 16 characters')),
  MEILI_INDEX_PREFIX: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^[a-z0-9_]{0,24}$/, 'must match [a-z0-9_]{0,24}')
      .default(''),
  ),
  SEARCH_SYNC_DEBOUNCE_MS: int(2000, 0, 60_000),
  SEARCH_SYNC_BATCH_SIZE: int(1000, 1, 10_000),

  // Object storage
  STORAGE_DRIVER: z.preprocess(emptyToUndefined, z.enum(['s3', 'local']).default('s3')),
  S3_ENDPOINT: optionalUrl(HTTP_PROTOCOLS),
  S3_REGION: z.preprocess(emptyToUndefined, z.string().default('us-east-1')),
  S3_BUCKET: optionalStr(),
  S3_ACCESS_KEY_ID: optionalStr(),
  S3_SECRET_ACCESS_KEY: optionalStr(),
  S3_USE_INSTANCE_ROLE: bool(false),
  S3_FORCE_PATH_STYLE: bool(false),
  S3_PUBLIC_BASE_URL: optionalUrl(HTTP_PROTOCOLS),
  S3_SIGNED_URL_TTL_SECONDS: int(900, 60, 604_800),
  LOCAL_STORAGE_DIR: z.preprocess(emptyToUndefined, z.string().default('/var/lib/quickcart/storage')),

  // Security
  JWT_SECRET: str(),
  JWT_SECRET_PREVIOUS: optionalStr(),
  JWT_ACCESS_TTL_SECONDS: int(900, 60, 86_400),
  JWT_REFRESH_TTL_SECONDS: int(2_592_000, 3600, 31_536_000),
  COOKIE_SECRET: str(),
  DATA_ENCRYPTION_KEY: str(),
  DATA_ENCRYPTION_KEY_PREVIOUS: optionalStr(),
  RATE_LIMIT_MAX: int(300, 1, 1_000_000),
  RATE_LIMIT_WINDOW_SECONDS: int(60, 1, 86_400),

  // Installer and licensing
  INSTALL_TOKEN: optionalStr(),
  INSTALL_TOKEN_TTL_MINUTES: int(120, 5, 1440),
  INSTALL_LOCK_FILE: z.preprocess(
    emptyToUndefined,
    z.string().startsWith('/', 'must be an absolute path').default('/var/lib/quickcart/installed.lock'),
  ),
  INSTALL_ALLOW_HTTP_LOCALHOST: bool(true),
  LICENSE_SERVER_URL: z.preprocess(
    emptyToUndefined,
    url(['https:']).default('https://license.quickcart.example/api/v1'),
  ),
  LICENSE_FILE: optionalStr(),
  LICENSE_REVALIDATE_HOURS: int(24, 1, 168),

  // Installer preflight thresholds
  PREFLIGHT_NTP_SERVER: z.preprocess(emptyToUndefined, z.string().default('pool.ntp.org')),
  PREFLIGHT_MAX_CLOCK_SKEW_MS: int(2000, 100, 60_000),
  PREFLIGHT_MIN_DISK_MB: int(2048, 256, 10_000_000),
  PREFLIGHT_MIN_MEMORY_MB: int(1024, 256, 10_000_000),

  // Worker
  WORKER_CONCURRENCY: int(10, 1, 500),
  OUTBOX_POLL_INTERVAL_MS: int(250, 50, 60_000),
  OUTBOX_BATCH_SIZE: int(500, 1, 10_000),

  // Realtime
  SOCKET_IO_TRANSPORTS: list('websocket').pipe(
    z
      .array(z.enum(['websocket', 'polling']))
      .min(1, 'must list at least one transport'),
  ),
  SOCKET_IO_PING_INTERVAL_MS: int(25_000, 1000, 120_000),

  // Observability
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalUrl(HTTP_PROTOCOLS),
  OTEL_SERVICE_NAME: optionalStr(),
  METRICS_ENABLED: bool(true),

  // Platform mail (super admin password reset, installer notifications)
  SMTP_URL: optionalUrl(['smtp:', 'smtps:']),
  MAIL_FROM: optionalStr(),

  // Routing
  OSRM_URL: optionalUrl(HTTP_PROTOCOLS),
});

type BaseEnv = z.infer<typeof baseSchema>;

/* -------------------------------------------------------------------------------------------------
 * Cross-field rules.
 * ------------------------------------------------------------------------------------------------- */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function userOf(connectionString: string): string {
  return decodeURIComponent(new URL(connectionString).username);
}

function decodedKeyLength(value: string): number | null {
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) return null;
  return Buffer.from(value, value.includes('-') || value.includes('_') ? 'base64url' : 'base64').length;
}

function fileReadable(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** One cross-field problem: the variable to blame and a message. */
export type CrossFieldProblem = readonly [key: keyof BaseEnv, message: string];

/**
 * Cross-field rules. Takes a partial object so it can also run when some variables failed their own
 * validation: every rule checks only the variables it needs, which lets loadEnv() report all problems in
 * one pass instead of revealing cross-field problems only after the per-variable ones are fixed.
 */
export function crossFieldProblems(env: Partial<BaseEnv>): CrossFieldProblem[] {
  const problems: CrossFieldProblem[] = [];
  const issue = (key: keyof BaseEnv, message: string): void => {
    problems.push([key, message]);
  };
  const isProduction = env.NODE_ENV === 'production';

  // PUBLIC_BASE_URL: origin only, HTTPS in production, under PLATFORM_ROOT_DOMAIN.
  if (env.PUBLIC_BASE_URL !== undefined) {
    const publicUrl = new URL(env.PUBLIC_BASE_URL);
    if (publicUrl.pathname !== '/' || publicUrl.search !== '' || publicUrl.hash !== '') {
      issue('PUBLIC_BASE_URL', 'must be an origin without path, query or fragment (e.g. https://platform.example.com)');
    }
    if (isProduction && publicUrl.protocol !== 'https:') {
      issue('PUBLIC_BASE_URL', 'must use https:// when NODE_ENV=production');
    }
    const root = env.PLATFORM_ROOT_DOMAIN;
    const host = publicUrl.hostname;
    if (root !== undefined && !LOCAL_HOSTS.has(host) && host !== root && !host.endsWith(`.${root}`)) {
      issue('PUBLIC_BASE_URL', `hostname must be PLATFORM_ROOT_DOMAIN (${root}) or one of its subdomains`);
    }
  }
  if (isProduction && env.CORS_ALLOWED_ORIGINS !== undefined) {
    for (const origin of env.CORS_ALLOWED_ORIGINS) {
      if (!origin.startsWith('https://')) issue('CORS_ALLOWED_ORIGINS', `origin "${origin}" must use https:// in production`);
    }
  }
  if (env.PORT !== undefined && env.PORT === env.INTERNAL_PORT) issue('INTERNAL_PORT', 'must differ from PORT');

  // Secret strength and separation.
  const strongSecrets: Array<[keyof BaseEnv, string | undefined]> = [
    ['JWT_SECRET', env.JWT_SECRET],
    ['JWT_SECRET_PREVIOUS', env.JWT_SECRET_PREVIOUS],
    ['COOKIE_SECRET', env.COOKIE_SECRET],
  ];
  if (isProduction) strongSecrets.push(['MEILI_MASTER_KEY', env.MEILI_MASTER_KEY]);
  for (const [key, value] of strongSecrets) {
    if (value !== undefined && value.length < MIN_SECRET_LENGTH) {
      issue(key, `must be at least ${MIN_SECRET_LENGTH} characters (generate with: openssl rand -base64 48)`);
    }
  }
  if (env.JWT_SECRET !== undefined && env.JWT_SECRET === env.COOKIE_SECRET) {
    issue('COOKIE_SECRET', 'must differ from JWT_SECRET');
  }
  if (env.JWT_SECRET_PREVIOUS !== undefined && env.JWT_SECRET_PREVIOUS === env.JWT_SECRET) {
    issue('JWT_SECRET_PREVIOUS', 'must differ from JWT_SECRET (it holds the key being rotated out)');
  }
  for (const key of ['DATA_ENCRYPTION_KEY', 'DATA_ENCRYPTION_KEY_PREVIOUS'] as const) {
    const value = env[key];
    if (value !== undefined && decodedKeyLength(value) !== 32) {
      issue(key, 'must be exactly 32 bytes encoded as base64 or base64url (generate with: openssl rand -base64 32)');
    }
  }
  if (env.INSTALL_TOKEN !== undefined) {
    if (!/^[A-Za-z0-9_-]+$/.test(env.INSTALL_TOKEN) || env.INSTALL_TOKEN.length < MIN_INSTALL_TOKEN_LENGTH) {
      issue('INSTALL_TOKEN', `must be base64url and at least ${MIN_INSTALL_TOKEN_LENGTH} characters (32 random bytes: openssl rand 32 | basenc --base64url | tr -d =)`);
    }
  }

  // Database roles: the request pool must never run as the schema owner (owners bypass RLS).
  const appUser = env.DATABASE_URL !== undefined ? userOf(env.DATABASE_URL) : undefined;
  const platformUser = env.DATABASE_PLATFORM_URL !== undefined ? userOf(env.DATABASE_PLATFORM_URL) : undefined;
  if (appUser !== undefined && appUser === platformUser) {
    issue('DATABASE_PLATFORM_URL', 'must use a different role than DATABASE_URL (expected app_platform vs app_user)');
  }
  if (env.DATABASE_MIGRATION_URL !== undefined) {
    const ownerUser = userOf(env.DATABASE_MIGRATION_URL);
    if (ownerUser === appUser || ownerUser === platformUser) {
      issue('DATABASE_MIGRATION_URL', 'must use the schema owner role, not app_user or app_platform');
    }
  }
  if ((env.APP_ROLE === 'migrate' || env.APP_ROLE === 'cli') && env.DATABASE_MIGRATION_URL === undefined) {
    issue('DATABASE_MIGRATION_URL', `is required when APP_ROLE=${env.APP_ROLE}`);
  }
  if (env.DATABASE_SSL_MODE === 'verify-full' && env.DATABASE_SSL_CA_FILE === undefined) {
    issue('DATABASE_SSL_CA_FILE', 'is required when DATABASE_SSL_MODE=verify-full');
  }
  if (env.DATABASE_SSL_CA_FILE !== undefined && !fileReadable(env.DATABASE_SSL_CA_FILE)) {
    issue('DATABASE_SSL_CA_FILE', `file not found or not readable: ${env.DATABASE_SSL_CA_FILE}`);
  }
  if (
    env.DATABASE_IDLE_IN_TX_TIMEOUT_MS !== undefined &&
    env.DATABASE_STATEMENT_TIMEOUT_MS !== undefined &&
    env.DATABASE_IDLE_IN_TX_TIMEOUT_MS < env.DATABASE_STATEMENT_TIMEOUT_MS
  ) {
    issue('DATABASE_IDLE_IN_TX_TIMEOUT_MS', 'must be >= DATABASE_STATEMENT_TIMEOUT_MS');
  }

  // Object storage.
  if (env.STORAGE_DRIVER === 's3') {
    if (env.S3_BUCKET === undefined) issue('S3_BUCKET', 'is required when STORAGE_DRIVER=s3');
    if (env.S3_USE_INSTANCE_ROLE === false) {
      if (env.S3_ACCESS_KEY_ID === undefined) issue('S3_ACCESS_KEY_ID', 'is required when STORAGE_DRIVER=s3 and S3_USE_INSTANCE_ROLE=false');
      if (env.S3_SECRET_ACCESS_KEY === undefined) issue('S3_SECRET_ACCESS_KEY', 'is required when STORAGE_DRIVER=s3 and S3_USE_INSTANCE_ROLE=false');
    }
    if (env.S3_FORCE_PATH_STYLE === true && env.S3_ENDPOINT === undefined) {
      issue('S3_ENDPOINT', 'is required when S3_FORCE_PATH_STYLE=true (path-style is for MinIO and other S3-compatible endpoints)');
    }
    if (isProduction && env.S3_PUBLIC_BASE_URL !== undefined && !env.S3_PUBLIC_BASE_URL.startsWith('https://')) {
      issue('S3_PUBLIC_BASE_URL', 'must use https:// in production');
    }
  } else if (env.STORAGE_DRIVER === 'local' && isProduction) {
    issue('STORAGE_DRIVER', 'local storage is not allowed in production (files would not be shared between replicas); use s3');
  }

  // Licensing.
  if (env.LICENSE_FILE !== undefined && !fileReadable(env.LICENSE_FILE)) {
    issue('LICENSE_FILE', `file not found or not readable: ${env.LICENSE_FILE}`);
  }

  // Mail.
  if (env.MAIL_FROM !== undefined && env.SMTP_URL === undefined) {
    issue('SMTP_URL', 'is required when MAIL_FROM is set');
  }

  return problems;
}

export const envSchema = baseSchema.superRefine((env, ctx) => {
  for (const [key, message] of crossFieldProblems(env)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message });
  }
});

/**
 * Parses each variable on its own and keeps the ones that are valid. Used only on the failure path so the
 * cross-field rules can still run against everything that did parse.
 */
function parsePartial(values: Record<string, string | undefined>): Partial<BaseEnv> {
  const partial: Record<string, unknown> = {};
  for (const [key, fieldSchema] of Object.entries(baseSchema.shape) as Array<[string, z.ZodTypeAny]>) {
    const result = fieldSchema.safeParse(values[key]);
    if (result.success && result.data !== undefined) partial[key] = result.data;
  }
  return partial as Partial<BaseEnv>;
}

/** Fully validated, typed configuration. The only way the codebase reads configuration. */
export type Env = Readonly<
  Omit<z.infer<typeof envSchema>, 'REDIS_CACHE_URL' | 'OTEL_SERVICE_NAME'> & {
    /** Defaults to REDIS_URL when not set. */
    REDIS_CACHE_URL: string;
    /** Defaults to quickcart-<APP_ROLE>. */
    OTEL_SERVICE_NAME: string;
  }
>;

/* -------------------------------------------------------------------------------------------------
 * *_FILE resolution.
 * ------------------------------------------------------------------------------------------------- */
export interface FileResolution {
  values: Record<string, string | undefined>;
  problems: string[];
}

/**
 * Copies the raw environment and replaces each FOO_FILE (for secret keys) with the file content as FOO.
 * Errors are collected rather than thrown so they can be reported together with schema errors.
 */
export function resolveFileSecrets(
  source: Readonly<Record<string, string | undefined>>,
  readFile: (path: string) => string = (path) => readFileSync(path, 'utf8'),
): FileResolution {
  const values: Record<string, string | undefined> = { ...source };
  const problems: string[] = [];

  for (const key of SECRET_KEYS) {
    const fileKey = `${key}${FILE_SUFFIX}`;
    const filePath = source[fileKey]?.trim();
    delete values[fileKey];
    if (filePath === undefined || filePath === '') continue;

    const direct = source[key];
    if (direct !== undefined && direct.trim() !== '') {
      problems.push(`${key}: set either ${key} or ${fileKey}, not both`);
      continue;
    }
    try {
      // Strip one trailing newline (CRLF or LF) added by editors and `echo`. Inner whitespace is kept.
      values[key] = readFile(filePath).replace(/\r?\n$/, '');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      problems.push(`${fileKey}: cannot read secret file "${filePath}" (${reason})`);
    }
  }

  // A *_FILE variable for a key that does not support it is almost always a typo; report it.
  const secretKeySet = new Set<string>(SECRET_KEYS);
  for (const key of Object.keys(source)) {
    if (key.endsWith(FILE_SUFFIX)) {
      const base = key.slice(0, -FILE_SUFFIX.length);
      if (!secretKeySet.has(base) && !(key in baseSchema.shape) && base in baseSchema.shape) {
        problems.push(`${key}: ${base} does not support the ${FILE_SUFFIX} form; set ${base} directly`);
      }
    }
  }

  return { values, problems };
}

/* -------------------------------------------------------------------------------------------------
 * Parsing and loading.
 * ------------------------------------------------------------------------------------------------- */
export type ParseEnvResult =
  | { ok: true; env: Env; warnings: string[] }
  | { ok: false; problems: string[]; warnings: string[] };

function formatIssue(issue: z.ZodIssue): string {
  const key = issue.path.length > 0 ? issue.path.join('.') : '(root)';
  if (issue.code === z.ZodIssueCode.invalid_type && issue.received === 'undefined') {
    return `${key}: is required but not set`;
  }
  return `${key}: ${issue.message}`;
}

function collectWarnings(env: Env): string[] {
  const warnings: string[] = [];
  if (env.NODE_ENV === 'production' && env.SMTP_URL === undefined) {
    warnings.push('SMTP_URL is not set: super admin password reset e-mails cannot be sent.');
  }
  if (env.SOCKET_IO_TRANSPORTS.includes('polling')) {
    warnings.push('SOCKET_IO_TRANSPORTS includes "polling": sticky sessions are required when more than one api replica runs.');
  }
  if (env.NODE_ENV === 'production' && env.DATABASE_SSL_MODE === 'disable') {
    const dbHost = new URL(env.DATABASE_URL).hostname;
    if (dbHost.includes('.')) {
      warnings.push(`DATABASE_SSL_MODE=disable with a non-local database host (${dbHost}); use require or verify-full for managed databases.`);
    }
  }
  if (env.INSTALL_TOKEN !== undefined) {
    warnings.push('INSTALL_TOKEN is set: remove it from the environment once installation is locked.');
  }
  return warnings;
}

/** Pure parse; no process side effects. Used by loadEnv() and by tests. */
export function parseEnv(
  source: Readonly<Record<string, string | undefined>>,
  readFile?: (path: string) => string,
): ParseEnvResult {
  const resolved = resolveFileSecrets(source, readFile);
  const parsed = envSchema.safeParse(resolved.values);
  const problems = [...resolved.problems];

  if (!parsed.success) {
    problems.push(...parsed.error.issues.map(formatIssue));
    // Zod skips superRefine when any field fails, so run the cross-field rules on the valid subset.
    const alreadyReported = new Set(parsed.error.issues.map((i) => String(i.path[0] ?? '')));
    for (const [key, message] of crossFieldProblems(parsePartial(resolved.values))) {
      if (!alreadyReported.has(key) || message.startsWith('is required when')) problems.push(`${key}: ${message}`);
    }
  }
  if (problems.length > 0 || !parsed.success) {
    return { ok: false, problems: [...new Set(problems)].sort(), warnings: [] };
  }

  const env: Env = Object.freeze({
    ...parsed.data,
    REDIS_CACHE_URL: parsed.data.REDIS_CACHE_URL ?? parsed.data.REDIS_URL,
    OTEL_SERVICE_NAME: parsed.data.OTEL_SERVICE_NAME ?? `quickcart-${parsed.data.APP_ROLE}`,
  });
  return { ok: true, env, warnings: collectWarnings(env) };
}

/** Exit status for configuration errors (sysexits.h EX_CONFIG). */
export const EXIT_CONFIG_ERROR = 78;

let cached: Env | undefined;

export interface LoadEnvOptions {
  source?: Readonly<Record<string, string | undefined>>;
  /** Where problems and warnings are written. Defaults to stderr (the logger is not configured yet). */
  write?: (line: string) => void;
  /** Called instead of process.exit when validation fails (tests). */
  exit?: (code: number) => never;
}

/**
 * Validates the environment once per process. On failure prints every problem and exits with status 78.
 * Secret values are never printed.
 */
export function loadEnv(options: LoadEnvOptions = {}): Env {
  if (cached !== undefined && options.source === undefined) return cached;

  const write = options.write ?? ((line: string) => process.stderr.write(`${line}\n`));
  const exit = options.exit ?? ((code: number): never => process.exit(code));
  const result = parseEnv(options.source ?? process.env);

  for (const warning of result.warnings) write(`[config] warning: ${warning}`);

  if (!result.ok) {
    write(`[config] invalid environment: ${result.problems.length} problem(s) found`);
    for (const problem of result.problems) write(`[config]   - ${problem}`);
    write('[config] see infra/docker/.env.example and 06-INSTALLER-DEPLOYMENT.md for every variable.');
    return exit(EXIT_CONFIG_ERROR);
  }

  if (options.source === undefined) cached = result.env;
  return result.env;
}

/** Copy of the configuration that is safe to log: secrets replaced, URL credentials removed. */
export function redactEnv(env: Env): Record<string, unknown> {
  const secretKeySet = new Set<string>(SECRET_KEYS);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      out[key] = undefined;
    } else if (secretKeySet.has(key) && typeof value === 'string' && /^[a-z]+:\/\//.test(value)) {
      const parsed = new URL(value);
      out[key] = `${parsed.protocol}//***@${parsed.host}${parsed.pathname}`;
    } else if (secretKeySet.has(key)) {
      out[key] = '***';
    } else {
      out[key] = value;
    }
  }
  return out;
}
