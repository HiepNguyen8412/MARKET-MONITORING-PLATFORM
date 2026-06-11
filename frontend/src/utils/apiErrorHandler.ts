/**
 * API Error Handler Utility
 * Centralized error handling and rate limit management
 */

export interface ApiErrorConfig {
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
}

const DEFAULT_CONFIG: ApiErrorConfig = {
  maxRetries: 3,
  initialBackoffMs: 1000,
  maxBackoffMs: 60000,
};

class RateLimiter {
  private backoffUntil: number = 0;
  private retryCount: number = 0;
  private config: ApiErrorConfig;

  constructor(config: Partial<ApiErrorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * ✅ Check if we should wait before making the next request
   */
  public isRateLimited(): boolean {
    return Date.now() < this.backoffUntil;
  }

  /**
   * ✅ Get time remaining in backoff period (ms)
   */
  public getBackoffRemaining(): number {
    return Math.max(0, this.backoffUntil - Date.now());
  }

  /**
   * ✅ Handle a 429 error - returns true if we should retry, false if max retries exceeded
   */
  public handle429Error(): boolean {
    this.retryCount++;

    if (this.retryCount > this.config.maxRetries) {
      console.error(
        `❌ Max retries (${this.config.maxRetries}) exceeded for 429. Giving up.`
      );
      return false; // Should not retry
    }

    // Calculate exponential backoff
    const backoffMs = Math.min(
      this.config.initialBackoffMs * Math.pow(2, this.retryCount - 1),
      this.config.maxBackoffMs
    );

    this.backoffUntil = Date.now() + backoffMs;

    console.warn(
      `⏳ Rate limited (429). Retry ${this.retryCount}/${this.config.maxRetries} after ${backoffMs}ms`
    );

    return true; // Should retry after backoff
  }

  /**
   * ✅ Reset on success
   */
  public reset(): void {
    this.backoffUntil = 0;
    this.retryCount = 0;
  }

  /**
   * ✅ Get current retry count
   */
  public getRetryCount(): number {
    return this.retryCount;
  }
}

/**
 * ✅ Format error message for display to users
 */
export function formatErrorMessage(error: any): string {
  if (error.response?.status === 429) {
    return '🔴 서버가 바쁩니다. 잠시 후 다시 시도해주세요. (429 Too Many Requests)';
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.message === 'Invalid credentials') {
    return 'Invalid credentials. Please check your email and password.';
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * ✅ Check if error is "Invalid credentials" (authentication error)
 */
export function isAuthenticationError(error: any): boolean {
  return (
    error.response?.status === 400 ||
    error.response?.status === 401 ||
    error.message === 'Invalid credentials' ||
    error.response?.data?.error?.includes('Invalid credentials')
  );
}

/**
 * ✅ Check if error is rate limiting
 */
export function isRateLimitError(error: any): boolean {
  return error.response?.status === 429;
}

/**
 * ✅ Check if error is network error
 */
export function isNetworkError(error: any): boolean {
  return !error.response && error.message;
}

export default RateLimiter;
