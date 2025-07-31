import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from '../../dto/product';
import { CategoriesService } from '../categories/categories.service';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    await this.categoriesService.findOne(createProductDto.categoryId);

    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(filterDto: ProductFilterDto): Promise<PaginatedResult<Product>> {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = filterDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true });

    this.applyFilters(queryBuilder, {
      search,
      categoryId,
      minPrice,
      maxPrice,
      inStock
    });

    const total = await queryBuilder.getCount();

    const validSortFields = ['name', 'price', 'createdAt', 'stock'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    queryBuilder
      .orderBy(`product.${sortField}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Product>,
    filters: {
      search?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
    }
  ): void {
    const { search, categoryId, minPrice, maxPrice, inStock } = filters;

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (inStock !== undefined) {
      if (inStock) {
        queryBuilder.andWhere('product.stock > 0');
      } else {
        queryBuilder.andWhere('product.stock = 0');
      }
    }
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
      relations: ['category']
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (updateProductDto.categoryId && updateProductDto.categoryId !== product.categoryId) {
      await this.categoriesService.findOne(updateProductDto.categoryId);
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productRepository.save(product);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    
    if (product.stock + quantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    product.stock += quantity;
    return this.productRepository.save(product);
  }

  async decreaseStock(id: string, quantity: number): Promise<Product> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }
    return this.updateStock(id, -quantity);
  }

  async increaseStock(id: string, quantity: number): Promise<Product> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }
    return this.updateStock(id, quantity);
  }

  async checkStock(id: string, requiredQuantity: number): Promise<boolean> {
    const product = await this.findOne(id);
    return product.stock >= requiredQuantity;
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { categoryId, isActive: true },
      relations: ['category'],
      order: { createdAt: 'DESC' }
    });
  }

  async findLowStockProducts(threshold: number = 5): Promise<Product[]> {
    return this.productRepository.find({
      where: { isActive: true },
      relations: ['category'],
      order: { stock: 'ASC' }
    }).then(products => products.filter(product => product.stock <= threshold));
  }
}
