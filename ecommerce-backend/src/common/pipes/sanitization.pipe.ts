import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { filterXSS } from 'xss';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' || metadata.type === 'query' || metadata.type === 'param') {
      return this.sanitizeValue(value);
    }
    return value;
  }

  private sanitizeValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item));
    }

    if (typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeValue(val);
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(str: string): string {
    // Basic XSS protection
    let sanitized = filterXSS(str, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
    });

    // Check for potential SQL injection
    const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi;
    if (sqlPatterns.test(sanitized)) {
      throw new BadRequestException('Invalid input detected');
    }

    // Check for NoSQL injection patterns
    const nosqlPatterns = /(\$where|\$ne|\$gt|\$lt|\$in|\$nin|\$or|\$and)/gi;
    if (nosqlPatterns.test(sanitized)) {
      throw new BadRequestException('Invalid input detected');
    }

    return sanitized.trim();
  }
}