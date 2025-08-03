import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export function configureSecurityHeaders(app: INestApplication): void {
  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'no-referrer' },
      permittedCrossDomainPolicies: false,
    }),
  );

  // Optimized rate limiting for better performance
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased limit for better performance
    message: {
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      statusCode: 429,
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks and static files
    skip: (req) => {
      return req.path.startsWith('/uploads/') || 
             req.path === '/health' || 
             req.path === '/api';
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        path: req.url,
        retryAfter: Math.ceil(15 * 60), // 15 minutes in seconds
      });
    },
    // Enable Redis-like storage for better performance in production
    store: process.env.NODE_ENV === 'production' ? undefined : undefined, // Add Redis store here if needed
  });

  // Apply rate limiting to all routes
  app.use(limiter);

  // Stricter rate limiting for auth routes with better error handling
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Increased from 5 to 10 for better UX
    message: {
      error: 'Too many authentication attempts',
      message: 'Too many authentication attempts, please try again later.',
      statusCode: 429,
    },
    skipSuccessfulRequests: true,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too Many Authentication Attempts',
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil(15 * 60),
      });
    },
  });

  app.use('/auth', authLimiter);
}

export const securityConfig = {
  bcryptRounds: 12,
  jwtExpiresIn: '1d',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedDocumentTypes: [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    authMax: 10,
  },
};