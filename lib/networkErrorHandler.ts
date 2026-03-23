/**
 * Network Error Handler
 * Provides comprehensive network error detection, retry logic, and user-friendly error messages
 * 
 * **Validates: Requirement 18.7 - Add network error handling**
 */

export interface NetworkErrorOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  showToast?: boolean;
}

export interface NetworkError extends Error {
  code?: string;
  status?: number;
  isNetworkError: boolean;
  isTimeout: boolean;
  isServerError: boolean;
  isClientError: boolean;
  retryable: boolean;
}

/**
 * Detect if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  const err = error as any;
  
  // Check for common network error indicators
  return (
    err.message?.includes('fetch') ||
    err.message?.includes('network') ||
    err.message?.includes('Failed to fetch') ||
    err.message?.includes('NetworkError') ||
    err.message?.includes('ERR_NETWORK') ||
    err.message?.includes('ERR_CONNECTION') ||
    err.message?.includes('ECONNREFUSED') ||
    err.message?.includes('ETIMEDOUT') ||
    err.message?.includes('ENOTFOUND') ||
    err.code === 'NETWORK_ERROR' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ENOTFOUND' ||
    err.name === 'NetworkError' ||
    err.name === 'TypeError' && err.message?.includes('fetch')
  );
}

/**
 * Detect if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (!error) return false;
  
  const err = error as any;
  
  return (
    err.message?.includes('timeout') ||
    err.message?.includes('timed out') ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'TIMEOUT' ||
    err.name === 'TimeoutError'
  );
}

/**
 * Detect if an error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  if (!error) return false;
  
  const err = error as any;
  const status = err.status || err.statusCode;
  
  return status >= 500 && status < 600;
}

/**
 * Detect if an error is a client error (4xx)
 */
export function isClientError(error: unknown): boolean {
  if (!error) return false;
  
  const err = error as any;
  const status = err.status || err.statusCode;
  
  return status >= 400 && status < 500;
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;
  
  // Network errors are retryable
  if (isNetworkError(error)) return true;
  
  // Timeout errors are retryable
  if (isTimeoutError(error)) return true;
  
  // Server errors (5xx) are retryable
  if (isServerError(error)) return true;
  
  // Rate limit errors (429) are retryable
  const err = error as any;
  if (err.status === 429 || err.statusCode === 429) return true;
  
  // Service unavailable (503) is retryable
  if (err.status === 503 || err.statusCode === 503) return true;
  
  return false;
}

/**
 * Create a standardized network error object
 */
export function createNetworkError(error: unknown): NetworkError {
  const err = error as any;
  
  const networkError = new Error(
    err.message || 'Network error occurred'
  ) as NetworkError;
  
  networkError.name = 'NetworkError';
  networkError.code = err.code;
  networkError.status = err.status || err.statusCode;
  networkError.isNetworkError = isNetworkError(error);
  networkError.isTimeout = isTimeoutError(error);
  networkError.isServerError = isServerError(error);
  networkError.isClientError = isClientError(error);
  networkError.retryable = isRetryableError(error);
  
  return networkError;
}

/**
 * Get a user-friendly error message for network errors
 */
export function getNetworkErrorMessage(error: unknown): string {
  const err = error as any;
  
  // Check for specific error types
  if (isTimeoutError(error)) {
    return 'Request timed out. Please check your internet connection and try again.';
  }
  
  if (isNetworkError(error)) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  
  if (isServerError(error)) {
    return 'Server error occurred. Please try again later.';
  }
  
  // Check for specific status codes
  const status = err.status || err.statusCode;
  
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please log in again.';
    case 403:
      return 'Access denied. You don\'t have permission to perform this action.';
    case 404:
      return 'Resource not found. The requested item may have been deleted.';
    case 409:
      return 'Conflict detected. The resource may have been modified by another user.';
    case 422:
      return 'Validation error. Please check your input and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. The server took too long to respond.';
    default:
      return err.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Exponential backoff delay calculation
 */
export function calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  
  return delay + jitter;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: NetworkErrorOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000
  } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add timeout wrapper
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`[Network] Attempt ${attempt + 1}/${maxRetries} failed:`, lastError);
      
      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw createNetworkError(error);
      }
      
      // Don't retry on last attempt
      if (attempt < maxRetries - 1) {
        const delay = calculateBackoffDelay(attempt, retryDelay);
        console.log(`[Network] Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw createNetworkError(lastError || new Error('Max retries exceeded'));
}

/**
 * Wrap an API call with network error handling
 */
export async function withNetworkErrorHandling<T>(
  fn: () => Promise<T>,
  options: NetworkErrorOptions = {}
): Promise<T> {
  try {
    return await retryWithBackoff(fn, options);
  } catch (error) {
    const networkError = createNetworkError(error);
    
    // Log the error
    console.error('[Network] Error:', {
      message: networkError.message,
      code: networkError.code,
      status: networkError.status,
      isNetworkError: networkError.isNetworkError,
      isTimeout: networkError.isTimeout,
      retryable: networkError.retryable
    });
    
    throw networkError;
  }
}

/**
 * Check if the user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Wait for the user to come back online
 */
export function waitForOnline(timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isOnline()) {
      resolve();
      return;
    }
    
    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      reject(new Error('Timeout waiting for network connection'));
    }, timeout);
    
    const onlineHandler = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', onlineHandler);
      resolve();
    };
    
    window.addEventListener('online', onlineHandler);
  });
}

/**
 * Monitor network status and execute callback on status change
 */
export function monitorNetworkStatus(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  const handleOnline = () => {
    console.log('[Network] Connection restored');
    onOnline();
  };
  
  const handleOffline = () => {
    console.log('[Network] Connection lost');
    onOffline();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
