# Deployment Guide

Bu dokümantasyon E-Commerce Backend API'sinin production ortamına nasıl deploy edileceğini açıklar.

## 🚀 Production Deployment Checklist

### 1. Environment Variables

Production ortamında aşağıdaki environment variables'ları ayarlayın:

```env
# Database (Production)
DATABASE_HOST=your-production-db-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-db-user
DATABASE_PASSWORD=strong-secure-password
DATABASE_NAME=ecommerce_prod

# JWT (Production)
JWT_SECRET=very-strong-jwt-secret-min-256-bits
JWT_EXPIRES_IN=1d

# Application
PORT=3000
NODE_ENV=production
BASE_URL=https://your-api-domain.com
FRONTEND_URL=https://your-frontend-domain.com

# Upload
UPLOAD_FOLDER=uploads
MAX_FILE_SIZE=5242880

# Security
BCRYPT_ROUNDS=12
```

### 2. Database Setup

```bash
# Production PostgreSQL kurulumu
sudo apt update
sudo apt install postgresql postgresql-contrib

# Database ve user oluşturma
sudo -u postgres psql
CREATE DATABASE ecommerce_prod;
CREATE USER ecommerce_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE ecommerce_prod TO ecommerce_user;
\q

# Connection test
psql -h localhost -U ecommerce_user -d ecommerce_prod
```

### 3. SSL/TLS Configuration

```nginx
# Nginx konfigürasyonu (/etc/nginx/sites-available/ecommerce-api)
server {
    listen 80;
    server_name your-api-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-api-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (uploads)
    location /uploads/ {
        alias /path/to/app/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🐳 Docker Deployment

### 1. Single Container

```bash
# Build image
docker build -t ecommerce-backend:latest .

# Run container
docker run -d \
  --name ecommerce-backend \
  --env-file .env.production \
  -p 3000:3000 \
  -v /path/to/uploads:/app/uploads \
  --restart unless-stopped \
  ecommerce-backend:latest
```

### 2. Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ecommerce_prod
      POSTGRES_USER: ecommerce_user
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - internal

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - internal

  app:
    image: ecommerce-backend:latest
    environment:
      DATABASE_HOST: postgres
      REDIS_HOST: redis
    env_file: .env.production
    ports:
      - "3000:3000"
    volumes:
      - app_uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - internal
      - external

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - app_uploads:/var/www/uploads:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - external

volumes:
  postgres_data:
  redis_data:
  app_uploads:

networks:
  internal:
    driver: bridge
  external:
    driver: bridge
```

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## ☁️ Cloud Deployment

### AWS ECS

```bash
# 1. ECR repository oluştur
aws ecr create-repository --repository-name ecommerce-backend

# 2. Image build et ve push et
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-west-2.amazonaws.com
docker build -t ecommerce-backend .
docker tag ecommerce-backend:latest your-account.dkr.ecr.us-west-2.amazonaws.com/ecommerce-backend:latest
docker push your-account.dkr.ecr.us-west-2.amazonaws.com/ecommerce-backend:latest

# 3. ECS task definition oluştur
# 4. ECS service oluştur
# 5. Application Load Balancer yapılandır
```

### Heroku

```bash
# 1. Heroku CLI kurulumu
npm install -g heroku

# 2. Login
heroku login

# 3. App oluştur
heroku create your-app-name

# 4. PostgreSQL addon ekle
heroku addons:create heroku-postgresql:standard-0

# 5. Environment variables ayarla
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set NODE_ENV=production

# 6. Deploy
git push heroku main

# 7. Database migration
heroku run npm run seed
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: ecommerce-backend
services:
- name: api
  source_dir: /
  github:
    repo: your-username/ecommerce-backend
    branch: main
  run_command: npm run start:prod
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    value: ${JWT_SECRET}
  - key: DATABASE_URL
    value: ${DATABASE_URL}

databases:
- name: ecommerce-db
  engine: PG
  version: "15"
  size: db-s-1vcpu-1gb
```

## 📊 Monitoring & Logging

### 1. Application Monitoring

```typescript
// src/monitoring/monitoring.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MonitoringService {
  constructor(private configService: ConfigService) {}

  // Application metrics
  trackRequest(endpoint: string, duration: number) {
    // Send to monitoring service (Datadog, New Relic, etc.)
  }

  trackError(error: Error, context: string) {
    // Send error to tracking service (Sentry, Bugsnag, etc.)
  }
}
```

### 2. Health Checks

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

### 3. Log Management

```bash
# Centralized logging with ELK Stack
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  elasticsearch:7.15.0

docker run -d \
  --name kibana \
  -p 5601:5601 \
  --link elasticsearch:elasticsearch \
  kibana:7.15.0

# Application logs to Elasticsearch
npm install winston winston-elasticsearch
```

## 🔒 Security Best Practices

### 1. Infrastructure Security

```bash
# Firewall configuration
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw deny 3000/tcp  # Block direct access to app
sudo ufw enable

# SSH hardening
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes
sudo systemctl restart ssh
```

### 2. Application Security

```typescript
// Additional security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 3. Database Security

```sql
-- Database security
-- Create read-only user for monitoring
CREATE USER monitoring WITH PASSWORD 'monitoring-password';
GRANT CONNECT ON DATABASE ecommerce_prod TO monitoring;
GRANT USAGE ON SCHEMA public TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;

-- Regular security audits
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

## 📈 Performance Optimization

### 1. Database Optimization

```sql
-- Database indexes for performance
CREATE INDEX CONCURRENTLY idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX CONCURRENTLY idx_orders_created_at_desc ON orders (created_at DESC);
CREATE INDEX CONCURRENTLY idx_products_category_active ON products (category_id, is_active);

-- Query optimization
ANALYZE;
VACUUM;
```

### 2. Application Caching

```typescript
// Redis caching
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: redisStore,
        host: 'localhost',
        port: 6379,
        ttl: 600, // 10 minutes
      }),
    }),
  ],
})
export class AppModule {}
```

### 3. CDN Configuration

```bash
# CloudFlare/AWS CloudFront for static assets
# Configure caching rules for /uploads/* paths
# Set appropriate cache headers
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      - name: Build and push Docker image
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker build -t ecommerce-backend .
          docker tag ecommerce-backend:latest $ECR_REGISTRY/ecommerce-backend:latest
          docker push $ECR_REGISTRY/ecommerce-backend:latest
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster production --service ecommerce-backend --force-new-deployment
```

## 📋 Production Checklist

- [ ] Environment variables configured
- [ ] Database secured and backed up
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Monitoring setup
- [ ] Logging centralized
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Backup strategy implemented
- [ ] CI/CD pipeline tested
- [ ] Health checks working
- [ ] Load testing completed
- [ ] Documentation updated

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connectivity
   psql -h $DATABASE_HOST -U $DATABASE_USERNAME -d $DATABASE_NAME
   
   # Check logs
   docker logs ecommerce-backend
   ```

2. **Memory Issues**
   ```bash
   # Monitor memory usage
   docker stats ecommerce-backend
   
   # Increase memory limits
   docker run --memory="1g" --memory-swap="2g" ecommerce-backend
   ```

3. **Performance Issues**
   ```bash
   # Check application metrics
   curl http://localhost:3000/health
   
   # Database query analysis
   EXPLAIN ANALYZE SELECT * FROM products WHERE name ILIKE '%search%';
   ```

### Support

For production support issues:
- Check application logs
- Monitor system resources
- Review error tracking dashboard
- Contact development team with correlation IDs