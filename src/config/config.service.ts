import * as dotenv from 'dotenv';
import * as Joi from 'joi';

export interface EnvConfig {
  [key: string]: string;
}

export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor() {
    dotenv.config();
    this.envConfig = this.validateInput(process.env);
  }

  /*
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string().valid('development', 'production', 'test', 'provision').default('development'),
      DB_PORT: Joi.number().default(5432),
      SECRET_KEY: Joi.string().required(),
      DB_HOSTNAME: Joi.string(),
      DB_PASSWORD: Joi.string().allow(''),
      DB_USERNAME: Joi.string().required(),
      REDIS_PORT: Joi.number().default('6379'),
      REDIS_HOST: Joi.string().default('localhost'),
      ADMIN_PASSWORD: Joi.string(),
      USER_PASSWORD: Joi.string(),
      FIRST_RUN: Joi.boolean().default(false),
      RELIC_KEY: Joi.string(),
      BASE_FOLDER: Joi.string().required(),
      MAL_CLIENT_ID: Joi.string(),
      MAL_CLIENT_SECRET: Joi.string(),
      MAL_REDIRECT_URL: Joi.string().default('localhost:8080')
    }).unknown(true);

    const { error, value } = envVarsSchema.validate(envConfig);
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return value;
  }

  get secretKey(): string {
    return String(this.envConfig.SECRET_KEY);
  }

  get databaseHostName(): string {
    return String(this.envConfig.DB_HOSTNAME);
  }

  get databaseUserName(): string {
    return String(this.envConfig.DB_USERNAME);
  }

  get databasePassword(): string {
    return String(this.envConfig.DB_PASSWORD);
  }

  get databasePort(): number {
    return Number(this.envConfig.DB_PORT);
  }

  get firstRun(): boolean {
    return Boolean(this.envConfig.FIRST_RUN);
  }

  get baseFolder(): string {
    return String(this.envConfig.BASE_FOLDER);
  }

  get defaultPasswords(): DefaultPasswords {
    return {
      admin: String(this.envConfig.ADMIN_PASSWORD),
      user: String(this.envConfig.USER_PASSWORD),
    };
  }

  get redisConfig() {
    return {
      port: Number(this.envConfig.REDIS_PORT),
      host: String(this.envConfig.REDIS_HOST),
    };
  }


  get malConfig() {
    return {
      clientId: String(this.envConfig.MAL_CLIENT_ID),
      clientSecret: String(this.envConfig.MAL_CLIENT_SECRET),
      redirectUrl: String(this.envConfig.MAL_REDIRECT_URL),
    };
  }
}

interface DefaultPasswords {
  admin: string;
  user: string;
}
