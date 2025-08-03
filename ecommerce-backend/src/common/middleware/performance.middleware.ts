import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_REQUESTS = 200;

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Get or initialize request count for this IP
    let requestData = this.requestCounts.get(clientIp);
    if (!requestData || now > requestData.resetTime) {
      requestData = { count: 0, resetTime: now + this.WINDOW_MS };
      this.requestCounts.set(clientIp, requestData);
    }

    // Increment request count
    requestData.count++;

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', this.MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, this.MAX_REQUESTS - requestData.count));
    res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());

    // Check if rate limit exceeded
    if (requestData.count > this.MAX_REQUESTS) {
      return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        error: 'Rate Limit Exceeded',
        message: 'Too many requests. Please try again later.',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
        path: req.url,
      });
    }

    // Add performance monitoring
    const startTime = Date.now();
    
    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;
      
      // Add response time header
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      
      // Log slow requests (over 1 second)
      if (responseTime > 1000) {
        console.warn(`Slow request detected: ${req.method} ${req.url} - ${responseTime}ms`);
      }
      
      // Call original end method
      originalEnd.call(this, chunk, encoding);
    };

    next();
  }

  // Clean up old entries periodically
  private cleanup() {
    const now = Date.now();
    for (const [ip, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(ip);
      }
    }
  }
}