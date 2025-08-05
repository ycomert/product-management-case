import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entity/product.entity';
import { ProductRepositoryService } from './product.repository.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [ProductRepositoryService],
  exports: [ProductRepositoryService],
})
export class ProductRepositoryModule {}