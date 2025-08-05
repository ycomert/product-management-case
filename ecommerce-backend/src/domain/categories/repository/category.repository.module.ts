import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entity/category.entity';
import { CategoryRepositoryService } from './category.repository.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [CategoryRepositoryService],
  exports: [CategoryRepositoryService],
})
export class CategoryRepositoryModule {}