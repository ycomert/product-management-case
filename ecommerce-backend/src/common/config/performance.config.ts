export const performanceConfig = {
  // Rate limiting settings
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Maximum requests per window
    authMax: 10, // Maximum auth requests per window
    skipPaths: ['/uploads/', '/health', '/api'], // Paths to skip rate limiting
  },
  
  // Database connection pool settings
  database: {
    max: 20, // Maximum connections
    min: 5,  // Minimum connections
    acquire: 30000, // Maximum time to acquire connection (ms)
    idle: 10000, // Maximum time connection can be idle (ms)
  },
  
  // Throttler settings
  throttler: [
    {
      ttl: 60000, // 1 minute
      limit: 30, // Requests per minute
    },
    {
      ttl: 300000, // 5 minutes
      limit: 100, // Requests per 5 minutes
    },
  ],
  
  // Performance monitoring
  monitoring: {
    slowRequestThreshold: 1000, // Log requests slower than 1 second
    enableResponseTimeHeaders: true,
    enableRateLimitHeaders: true,
  },
  
  // Caching settings
  cache: {
    ttl: 300, // 5 minutes default TTL
    maxSize: 1000, // Maximum cache entries
  },
  
  // Security settings
  security: {
    bcryptRounds: 12,
    jwtExpiresIn: '1d',
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  
  // Environment-specific settings
  environment: {
    production: {
      enableLogging: false,
      enableDebug: false,
      enableSwagger: false,
    },
    development: {
      enableLogging: true,
      enableDebug: true,
      enableSwagger: true,
    },
  },
};

// Helper function to get environment-specific config
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  return {
    ...performanceConfig,
    ...performanceConfig.environment[env],
  };
}

// Helper function to check if rate limiting should be skipped for a path
export function shouldSkipRateLimit(path: string): boolean {
  return performanceConfig.rateLimit.skipPaths.some(skipPath => 
    path.startsWith(skipPath)
  );
}