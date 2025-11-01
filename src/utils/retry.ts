import { Logger } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  delay: number; // initial delay in ms
  exponentialBackoff: boolean;
  maxDelay?: number;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, delay, exponentialBackoff, maxDelay } = options;
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        Logger.error(`Retry failed after ${maxAttempts} attempts`, error);
        throw error;
      }

      const currentDelay = exponentialBackoff
        ? Math.min(delay * Math.pow(2, attempt - 1), maxDelay || Infinity)
        : delay;

      Logger.warn(
        `Attempt ${attempt} failed, retrying in ${currentDelay}ms...`,
        error
      );
      await sleep(currentDelay);
    }
  }

  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

