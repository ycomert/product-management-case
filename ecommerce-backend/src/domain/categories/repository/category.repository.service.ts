import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entity/category.entity';

@Injectable()
export class CategoryRepositoryService {
  constructor(
    @InjectRepository(Category)
    private repository: Repository<Category>,
  ) {}

  async create(data: Partial<Category>): Promise<Category> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<Category | null> {
    return this.repository.findOne({ 
      where: { id: id as any },
      relations: ['products']
    });
  }

  async findAll(): Promise<Category[]> {
    return this.repository.find({ relations: ['products'] });
  }

  async findByName(name: string): Promise<Category | null> {
    return this.repository.findOne({ where: { name } });
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    await this.repository.update(id, data);
    const result = await this.findById(id);
    if (!result) {
      throw new Error('Category not found');
    }
    return result;
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findActiveCategories(): Promise<Category[]> {
    return this.repository.find({ 
      where: { isActive: true },
      relations: ['products']
    });
  }
}