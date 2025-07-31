import * as crypto from 'crypto';

export class SecurityUtils {
  /**
   * Generate a secure random string
   */
  static generateSecureRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Hash sensitive data (non-password)
   */
  static hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static isStrongPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize filename for safe storage
   */
  static sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '');
    
    // Remove hidden file indicators
    sanitized = sanitized.replace(/^\.+/, '');
    
    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.substring(sanitized.lastIndexOf('.'));
      sanitized = sanitized.substring(0, 255 - ext.length) + ext;
    }

    return sanitized;
  }

  /**
   * Check if string contains potential injection patterns
   */
  static containsSuspiciousPatterns(input: string): boolean {
    const patterns = [
      // SQL Injection patterns
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      // NoSQL Injection patterns
      /(\$where|\$ne|\$gt|\$lt|\$in|\$nin|\$or|\$and)/gi,
      // XSS patterns
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      // Path traversal
      /\.\.[\/\\]/g,
      // Command injection
      /[;&|`$()]/g,
    ];

    return patterns.some(pattern => pattern.test(input));
  }

  /**
   * Rate limiting key generator
   */
  static generateRateLimitKey(ip: string, endpoint: string): string {
    return `rate_limit:${ip}:${endpoint}`;
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }
    
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(data.length - visibleChars * 2);
    
    return `${start}${middle}${end}`;
  }

  /**
   * Clean object of potentially dangerous properties
   */
  static cleanObject(obj: any): any {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item));
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!dangerousKeys.includes(key)) {
        cleaned[key] = this.cleanObject(value);
      }
    }

    return cleaned;
  }
}