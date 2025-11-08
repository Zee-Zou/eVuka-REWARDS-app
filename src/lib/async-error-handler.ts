import { logger } from "./logger";

export interface AsyncErrorHandlerOptions<T = unknown> {
  fallbackValue?: T;
  retryCount?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  context?: string;
}

/**
 * Wraps an async function with error handling and retry logic
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: AsyncErrorHandlerOptions<T> = {}
): Promise<T | undefined> {
  const {
    fallbackValue,
    retryCount = 0,
    retryDelay = 1000,
    onError,
    context = "async operation",
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retryCount) {
        logger.warn(`${context} failed, retrying (attempt ${attempt + 1}/${retryCount})`, {
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  if (lastError) {
    logger.error(`${context} failed after ${retryCount + 1} attempts`, {
      error: lastError.message,
    });

    if (onError) {
      onError(lastError);
    }
  }

  return fallbackValue;
}

/**
 * Wraps a sync function with error handling
 */
export function withSyncErrorHandling<T>(
  fn: () => T,
  options: Omit<AsyncErrorHandlerOptions<T>, "retryCount" | "retryDelay"> = {}
): T | undefined {
  const { fallbackValue, onError, context = "sync operation" } = options;

  try {
    return fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`${context} failed`, { error: err.message });

    if (onError) {
      onError(err);
    }

    return fallbackValue;
  }
}

/**
 * Creates a safe async function that won't throw
 */
export function createSafeAsync<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  options: AsyncErrorHandlerOptions<T> = {}
) {
  return async (...args: Args): Promise<T | undefined> => {
    return withErrorHandling(() => fn(...args), options);
  };
}

/**
 * Handles promise rejections globally
 */
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    logger.error("Unhandled promise rejection", {
      error: event.reason?.message || String(event.reason),
    });

    // Prevent the default handling (which would log to console)
    event.preventDefault();
  });

  // Handle global errors
  window.addEventListener("error", (event: ErrorEvent) => {
    logger.error("Global error", {
      error: event.error?.message || event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}