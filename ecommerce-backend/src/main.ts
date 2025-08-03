import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpAdapterHost } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { SanitizationPipe } from './common/pipes/sanitization.pipe';
import { configureSecurityHeaders } from './common/config/security.config';
import { getEnvironmentConfig } from './common/config/performance.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const httpAdapterHost = app.get(HttpAdapterHost);
  const envConfig = getEnvironmentConfig();

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Configure security headers and rate limiting
  configureSecurityHeaders(app);
  
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'http://localhost:3001']
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));

  // Global interceptors with performance monitoring
  const interceptors = [
    new ResponseTransformInterceptor(),
  ];

  // Only add logging interceptor in development
  if (envConfig.enableLogging) {
    interceptors.unshift(new LoggingInterceptor());
  }

  app.useGlobalInterceptors(...interceptors);

  // Global pipes
  app.useGlobalPipes(
    new SanitizationPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Swagger configuration (only in development)
  if (envConfig.enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('E-Commerce API')
      .setDescription('E-Commerce Platform API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
  if (envConfig.enableSwagger) {
    console.log(`Swagger documentation: http://localhost:${port}/api`);
  }
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Rate limit: ${envConfig.rateLimit.max} requests per ${envConfig.rateLimit.windowMs / 1000 / 60} minutes`);
}
bootstrap();
