import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from './entity/product.entity';
import { ProductFilterDto } from '../dto/product-filter.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ProductRepositoryService {
  constructor(
    @InjectRepository(Product)
    private repository: Repository<Product>,
  ) {}

  async create(data: Partial<Product>): Promise<Product> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({ 
      where: { id: id as any },
      relations: ['category']
    });
  }

  async findAll(): Promise<Product[]> {
    return this.repository.find({ relations: ['category'] });
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    await this.repository.update(id, data);
    const result = await this.findById(id);
    if (!result) {
      throw new Error('Product not found');
    }
    return result;
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.repository.find({ 
      where: { categoryId },
      relations: ['category']
    });
  }

  async findWithFilters(filters: ProductFilterDto): Promise<PaginatedResult<Product>> {
    const queryBuilder: SelectQueryBuilder<Product> = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (filters.name) {
      queryBuilder.andWhere('product.name ILIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        queryBuilder.andWhere('product.stock > 0');
      } else {
        queryBuilder.andWhere('product.stock = 0');
      }
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive: filters.isActive });
    }

    const total = await queryBuilder.getCount();
    
    if (filters.page && filters.limit) {
      const skip = (filters.page - 1) * filters.limit;
      queryBuilder.skip(skip).take(filters.limit);
    }

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page: filters.page || 1,
      limit: filters.limit || total,
      totalPages: filters.limit ? Math.ceil(total / filters.limit) : 1,
    };
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    await this.repository.update(id, { stock: quantity });
  }

  async decreaseStock(id: string, quantity: number): Promise<void> {
    await this.repository.decrement({ id: id as any }, 'stock', quantity);
  }

  async increaseStock(id: string, quantity: number): Promise<void> {
    await this.repository.increment({ id: id as any }, 'stock', quantity);
  }
}