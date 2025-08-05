import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './domain/users/repository/entity/user.entity';
import { Category } from './domain/categories/repository/entity/category.entity';
import { Product } from './domain/products/repository/entity/product.entity';
import { Order } from './domain/orders/repository/entity/order.entity';
import { OrderItem } from './domain/orders/repository/entity/order-item.entity';
import { AuthModule } from './domain/auth/auth.module';
import { UsersModule } from './domain/users/users.module';
import { ProductsModule } from './domain/products/products.module';
import { CategoryModule } from './domain/categories/category.module';
import { OrdersModule } from './domain/orders/orders.module';
import { UploadModule } from './domain/upload/upload.module';
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
        logging: true,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoryModule,
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
