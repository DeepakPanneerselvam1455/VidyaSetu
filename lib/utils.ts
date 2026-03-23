
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- PASSWORD STRENGTH ---
export function checkPasswordStrength(password: string) {
  let score = 0;
  if (!password) {
    return { score: 0, level: 'none' as const, text: '' };
  }

  // Very weak for short passwords
  if (password.length > 0 && password.length < 8) {
      return { score: 1, level: 'very weak' as const, text: 'Very Weak' };
  }

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const diversity = (hasLower ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0);
  
  if (diversity >= 2) score++;
  if (diversity >= 3) score++;
  if (diversity >= 4) score++;
  
  let level: 'none' | 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
  let text: string;
  switch (score) {
    case 0:
      level = 'none';
      text = '';
      break;
    case 1:
      level = 'very weak';
      text = 'Very Weak';
      break;
    case 2:
      level = 'weak';
      text = 'Weak';
      break;
    case 3:
      level = 'medium';
      text = 'Medium';
      break;
    case 4:
      level = 'strong';
      text = 'Strong';
      break;
    case 5:
      level = 'very strong';
      text = 'Very Strong';
      break;
    default:
      level = 'none';
      text = '';
  }

  return { score, level, text };
}

// --- INPUT VALIDATION ---
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100;
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// --- INPUT SANITIZATION ---
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Remove script tags and content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// --- DATE/TIME FORMATTING ---
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return formatDate(d);
}

// --- ERROR MESSAGE FORMATTING ---
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as Record<string, unknown>).message);
  }
  return 'An unexpected error occurred';
}

export function formatValidationError(field: string, message: string): string {
  return `${field}: ${message}`;
}

export function formatApiError(status: number, message: string): string {
  const statusMessages: Record<number, string> = {
    400: 'Bad request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not found',
    409: 'Conflict',
    422: 'Validation error',
    429: 'Too many requests',
    500: 'Server error',
    503: 'Service unavailable'
  };
  
  const statusText = statusMessages[status] || 'Unknown error';
  return `${statusText}: ${message}`;
}

// --- TYPE CHECKING ---
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// --- UTILITY HELPERS ---
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// --- FILE UPLOAD VALIDATION ---
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateFile(file: File, options: FileValidationOptions = {}): FileValidationResult {
  const errors: string[] = [];
  
  // Default: 10MB max size
  const maxSize = options.maxSize || 10 * 1024 * 1024;
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${formatFileSize(maxSize)}`);
  }
  
  // Check MIME type
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
    }
  }
  
  // Check file extension
  if (options.allowedExtensions && options.allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !options.allowedExtensions.includes(extension)) {
      errors.push(`File extension .${extension} is not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function validateImageFile(file: File): FileValidationResult {
  return validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  });
}

export function validateDocumentFile(file: File): FileValidationResult {
  return validateFile(file, {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'txt']
  });
}


// --- NETWORK ERROR HANDLING ---
export { 
  isNetworkError,
  isTimeoutError,
  isServerError,
  isClientError,
  isRetryableError,
  createNetworkError,
  getNetworkErrorMessage,
  calculateBackoffDelay,
  retryWithBackoff,
  withNetworkErrorHandling,
  isOnline,
  waitForOnline,
  monitorNetworkStatus
} from './networkErrorHandler';

export type { NetworkError, NetworkErrorOptions } from './networkErrorHandler';
