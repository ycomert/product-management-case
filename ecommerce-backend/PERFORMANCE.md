# Performance Optimization Guide

## Rate Limiting Configuration

This application uses multiple rate limiting mechanisms to prevent abuse and ensure optimal performance:

### 1. Express Rate Limiting
- **General routes**: 200 requests per 15 minutes
- **Auth routes**: 10 requests per 15 minutes
- **Skipped paths**: `/uploads/`, `/health`, `/api`

### 2. NestJS Throttler
- **1-minute window**: 30 requests per minute
- **5-minute window**: 100 requests per 5 minutes

## Performance Optimizations

### Database Connection Pool
- **Max connections**: 20
- **Min connections**: 5
- **Acquire timeout**: 30 seconds
- **Idle timeout**: 10 seconds

### Environment-Specific Settings

#### Development
- Logging enabled
- Debug mode enabled
- Swagger documentation enabled
- Detailed error messages

#### Production
- Logging disabled for better performance
- Debug mode disabled
- Swagger documentation disabled
- Minimal error messages

## Handling Rate Limit Exceeded

When rate limits are exceeded, the API returns:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "statusCode": 429,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "retryAfter": 900,
  "path": "/api/endpoint"
}
```

### Response Headers
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time
- `X-Response-Time`: Response time in milliseconds

## Performance Monitoring

### Slow Request Detection
- Requests taking longer than 1 second are logged
- Response time headers are added to all responses
- Performance metrics are available in logs

### Monitoring Endpoints
- `/health`: Health check endpoint (not rate limited)
- `/api`: Swagger documentation (development only)

## Configuration

### Environment Variables
```bash
NODE_ENV=production  # Enable production optimizations
PORT=3000           # Application port
FRONTEND_URL=http://localhost:3001  # CORS origin
```

### Rate Limiting Configuration
Edit `src/common/config/performance.config.ts` to adjust:
- Request limits
- Time windows
- Skip paths
- Database connection pool settings

## Troubleshooting Slow Requests

### 1. Check Rate Limits
```bash
# Check remaining requests
curl -I http://localhost:3000/api/endpoint
# Look for X-RateLimit-Remaining header
```

### 2. Monitor Response Times
```bash
# Check response time
curl -w "@curl-format.txt" http://localhost:3000/api/endpoint
```

### 3. Database Performance
- Check connection pool usage
- Monitor slow queries
- Verify indexes are in place

### 4. Memory Usage
- Monitor Node.js memory usage
- Check for memory leaks
- Optimize garbage collection

## Best Practices

### 1. Client-Side Rate Limiting
Implement exponential backoff in your frontend:
```javascript
const delay = (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 30000);
```

### 2. Caching
- Use Redis for session storage
- Implement response caching
- Cache frequently accessed data

### 3. Database Optimization
- Use database indexes
- Optimize queries
- Use connection pooling
- Implement query caching

### 4. Error Handling
- Implement proper error handling
- Use exponential backoff
- Provide meaningful error messages
- Log errors for debugging

## Production Deployment

### 1. Environment Setup
```bash
NODE_ENV=production
PORT=3000
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=your-database
```

### 2. Process Management
Use PM2 or similar process manager:
```bash
npm install -g pm2
pm2 start dist/main.js --name ecommerce-api
```

### 3. Load Balancing
- Use Nginx as reverse proxy
- Implement load balancing
- Configure SSL/TLS
- Set up monitoring

### 4. Monitoring
- Set up application monitoring
- Monitor database performance
- Track API response times
- Alert on rate limit violations

## Performance Testing

### Load Testing
Use tools like Apache Bench or Artillery:
```bash
# Test with 100 concurrent users, 1000 requests
ab -n 1000 -c 100 http://localhost:3000/api/endpoint
```

### Stress Testing
- Test rate limiting behavior
- Monitor memory usage
- Check database connection pool
- Verify error handling

## Support

For performance issues:
1. Check application logs
2. Monitor rate limiting headers
3. Verify database performance
4. Review configuration settings
5. Contact development team