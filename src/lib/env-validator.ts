/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are set at startup
 */

import { logger } from "./logger";

interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceKey?: string;
  };
  app: {
    mode: "development" | "production";
    debug: boolean;
  };
  features: {
    enableOCR: boolean;
    enableOfflineMode: boolean;
    enablePWA: boolean;
    enableExternalLogging: boolean;
  };
  endpoints?: {
    loggingEndpoint?: string;
    monitoringEndpoint?: string;
  };
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: EnvConfig | null = null;
  private validationErrors: string[] = [];

  private constructor() {}

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * Validate all required environment variables
   */
  public validate(): boolean {
    this.validationErrors = [];

    // Validate Supabase configuration
    this.validateSupabase();

    // Validate app configuration
    this.validateApp();

    // Validate features
    this.validateFeatures();

    // Validate endpoints
    this.validateEndpoints();

    if (this.validationErrors.length > 0) {
      logger.error("Environment validation failed", {
        errors: this.validationErrors,
      });
      return false;
    }

    logger.info("Environment validation successful");
    return true;
  }

  private validateSupabase(): void {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url) {
      this.validationErrors.push(
        "VITE_SUPABASE_URL is not set. Please configure Supabase URL."
      );
    } else if (!this.isValidUrl(url)) {
      this.validationErrors.push(
        "VITE_SUPABASE_URL is not a valid URL format."
      );
    }

    if (!anonKey) {
      this.validationErrors.push(
        "VITE_SUPABASE_ANON_KEY is not set. Please configure Supabase anonymous key."
      );
    } else if (anonKey.length < 20) {
      this.validationErrors.push(
        "VITE_SUPABASE_ANON_KEY appears to be invalid (too short)."
      );
    }

    // Service key is optional but warn if not set in production
    const serviceKey = import.meta.env.SUPABASE_SERVICE_KEY;
    if (import.meta.env.MODE === "production" && !serviceKey) {
      logger.warn(
        "SUPABASE_SERVICE_KEY is not set. Some server-side operations may fail."
      );
    }
  }

  private validateApp(): void {
    const mode = import.meta.env.MODE;
    if (mode !== "development" && mode !== "production") {
      this.validationErrors.push(
        `Invalid MODE: ${mode}. Must be 'development' or 'production'.`
      );
    }
  }

  private validateFeatures(): void {
    // Features are optional, just log their status
    const enableOCR = import.meta.env.VITE_ENABLE_OCR !== "false";
    const enableOfflineMode = import.meta.env.VITE_ENABLE_OFFLINE !== "false";
    const enablePWA = import.meta.env.VITE_ENABLE_PWA !== "false";

    logger.info("Feature flags", {
      enableOCR,
      enableOfflineMode,
      enablePWA,
    });
  }

  private validateEndpoints(): void {
    const loggingEndpoint = import.meta.env.VITE_LOGGING_ENDPOINT;
    const monitoringEndpoint = import.meta.env.VITE_MONITORING_ENDPOINT;

    if (loggingEndpoint && !this.isValidUrl(loggingEndpoint)) {
      logger.warn("VITE_LOGGING_ENDPOINT is not a valid URL format.");
    }

    if (monitoringEndpoint && !this.isValidUrl(monitoringEndpoint)) {
      logger.warn("VITE_MONITORING_ENDPOINT is not a valid URL format.");
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the validated configuration
   */
  public getConfig(): EnvConfig {
    if (!this.config) {
      this.config = {
        supabase: {
          url: import.meta.env.VITE_SUPABASE_URL || "",
          anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
          serviceKey: import.meta.env.SUPABASE_SERVICE_KEY,
        },
        app: {
          mode: (import.meta.env.MODE as "development" | "production") || "production",
          debug: import.meta.env.VITE_DEBUG_LOGS === "true",
        },
        features: {
          enableOCR: import.meta.env.VITE_ENABLE_OCR !== "false",
          enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE !== "false",
          enablePWA: import.meta.env.VITE_ENABLE_PWA !== "false",
          enableExternalLogging:
            import.meta.env.VITE_ENABLE_EXTERNAL_LOGGING !== "false",
        },
        endpoints: {
          loggingEndpoint: import.meta.env.VITE_LOGGING_ENDPOINT,
          monitoringEndpoint: import.meta.env.VITE_MONITORING_ENDPOINT,
        },
      };
    }
    return this.config;
  }

  /**
   * Get a specific environment variable with type safety
   */
  public getEnv<T = string>(
    key: string,
    defaultValue?: T,
    validator?: (value: string) => boolean
  ): T | undefined {
    const value = import.meta.env[key];

    if (!value) {
      return defaultValue;
    }

    if (validator && !validator(value)) {
      logger.warn(`Environment variable ${key} failed validation.`);
      return defaultValue;
    }

    return value as T;
  }

  /**
   * Check if a feature is enabled
   */
  public isFeatureEnabled(feature: keyof EnvConfig["features"]): boolean {
    return this.getConfig().features[feature];
  }

  /**
   * Get all validation errors
   */
  public getValidationErrors(): string[] {
    return [...this.validationErrors];
  }
}

export const envValidator = EnvironmentValidator.getInstance();

/**
 * Initialize environment validation at app startup
 */
export function initializeEnvironment(): boolean {
  const isValid = envValidator.validate();

  if (!isValid) {
    const errors = envValidator.getValidationErrors();
    console.error("❌ Environment validation failed:");
    errors.forEach((error) => console.error(`  - ${error}`));

    // In production, we should fail hard
    if (import.meta.env.MODE === "production") {
      throw new Error(
        "Environment validation failed. Please check your configuration."
      );
    }
  } else {
    logger.info("✅ Environment validation passed");
  }

  return isValid;
}