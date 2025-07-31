import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { filterXSS } from 'xss';

@Injectable()
export class SanitizationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize request body only
    // Query and params will be handled by SanitizationPipe
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    next();
  }

  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  private sanitizeString(str: string): string {
    // Remove XSS attempts
    let sanitized = filterXSS(str, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
    });

    // Remove SQL injection patterns
    sanitized = sanitized.replace(
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      '',
    );

    // Remove potential NoSQL injection patterns
    sanitized = sanitized.replace(/(\$where|\$ne|\$gt|\$lt|\$in|\$nin)/gi, '');

    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>'"]/g, '');

    return sanitized.trim();
  }
}