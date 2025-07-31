import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || request.connection.remoteAddress;

    const now = Date.now();
    const correlationId = `${now}-${Math.random().toString(36).substr(2, 9)}`;

    // Log request
    this.logger.log(
      `[${correlationId}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    // Log request body for non-GET requests (excluding sensitive data)
    if (method !== 'GET' && body && Object.keys(body).length > 0) {
      const sanitizedBody = this.sanitizeRequestBody(body);
      this.logger.debug(`[${correlationId}] Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    // Log query parameters
    if (query && Object.keys(query).length > 0) {
      this.logger.debug(`[${correlationId}] Query Params: ${JSON.stringify(query)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const delay = Date.now() - now;
          this.logger.log(
            `[${correlationId}] ${method} ${url} - ${response.statusCode} - ${delay}ms`,
          );
          
          // Log response for debug mode
          if (process.env.NODE_ENV === 'development' && data) {
            this.logger.debug(
              `[${correlationId}] Response: ${JSON.stringify(data).substring(0, 500)}${
                JSON.stringify(data).length > 500 ? '...' : ''
              }`,
            );
          }
        },
        error: (error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `[${correlationId}] ${method} ${url} - ERROR - ${delay}ms - ${error.message}`,
          );
        },
      }),
    );
  }

  private sanitizeRequestBody(body: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...body };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      const result = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          (result as any)[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          (result as any)[key] = sanitizeObject(value);
        } else {
          (result as any)[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeObject(sanitized);
  }
}