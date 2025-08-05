import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductRepositoryModule } from './repository/product.repository.module';
import { CategoryModule } from '../categories/category.module';

@Module({
  imports: [
    ProductRepositoryModule,
    CategoryModule,
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
