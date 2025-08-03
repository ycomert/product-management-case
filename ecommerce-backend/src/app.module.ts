import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User, Category, Product, Order, OrderItem } from './entities';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UploadModule } from './modules/upload/upload.module';
import { SanitizationMiddleware } from './common/middleware/sanitization.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: +configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, Category, Product, Order, OrderItem],
        synchronize: true,
        logging: process.env.NODE_ENV !== 'production', // Disable logging in production for better performance
        // Add connection pool configuration for better performance
        extra: {
          max: 20, // Maximum number of connections
          min: 5,  // Minimum number of connections
          acquire: 30000, // Maximum time to acquire connection
          idle: 10000, // Maximum time connection can be idle
        },
      }),
      inject: [ConfigService],
    }),
    // Optimized throttler configuration for better performance
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 30, // Increased from 10 to 30 for better performance
    }, {
      ttl: 300000, // 5 minutes
      limit: 100, // Additional limit for 5-minute window
    }]),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SanitizationMiddleware)
      .forRoutes('*');
  }
}
