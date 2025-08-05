import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Product } from './repository/entity/product.entity';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
import { ProductRepositoryService, PaginatedResult } from './repository/product.repository.service';
import { CategoryService } from '../categories/category.service';

@Injectable()
export class ProductsService {
  constructor(
    private productRepository: ProductRepositoryService,
    private categoriesService: CategoryService,
  ) {}

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    await this.categoriesService.getCategoryById(createProductDto.categoryId);

    return this.productRepository.create(createProductDto);
  }

  async listProducts(filterDto: ProductFilterDto): Promise<PaginatedResult<Product>> {
    return this.productRepository.findWithFilters(filterDto);
  }



  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product || !product.isActive) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return product;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.getProductById(id);

    if (updateProductDto.categoryId && updateProductDto.categoryId !== product.categoryId) {
      await this.categoriesService.getCategoryById(updateProductDto.categoryId);
    }

    return this.productRepository.update(id, updateProductDto);
  }

  async removeProduct(id: string): Promise<void> {
    await this.getProductById(id);
    await this.productRepository.update(id, { isActive: false });
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.getProductById(id);
    
    if (product.stock + quantity < 0) {
      throw new HttpException('Insufficient stock', HttpStatus.BAD_REQUEST);
    }

    const newStock = product.stock + quantity;
    await this.productRepository.updateStock(id, newStock);
    return this.getProductById(id);
  }

  async decreaseStock(id: string, quantity: number): Promise<Product> {
    if (quantity <= 0) {
      throw new HttpException('Quantity must be positive', HttpStatus.BAD_REQUEST);
    }
    return this.updateStock(id, -quantity);
  }

  async increaseStock(id: string, quantity: number): Promise<Product> {
    if (quantity <= 0) {
      throw new HttpException('Quantity must be positive', HttpStatus.BAD_REQUEST);
    }
    return this.updateStock(id, quantity);
  }

  async checkStock(id: string, requiredQuantity: number): Promise<boolean> {
    const product = await this.getProductById(id);
    return product.stock >= requiredQuantity;
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.productRepository.findByCategory(categoryId);
  }

  async findLowStockProducts(threshold: number = 5): Promise<Product[]> {
    const products = await this.productRepository.findAll();
    return products.filter(product => product.isActive && product.stock <= threshold);
  }
}
