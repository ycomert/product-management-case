import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Category } from './repository/entity/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CategoryRepositoryService } from './repository/category.repository.service';

@Injectable()
export class CategoryService {
  constructor(
    private categoryRepository: CategoryRepositoryService,
  ) {}

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existingCategory = await this.categoryRepository.findByName(createCategoryDto.name);

    if (existingCategory) {
      throw new HttpException('Category with this name already exists', HttpStatus.CONFLICT);
    }

    return this.categoryRepository.create(createCategoryDto);
  }

  async listCategory(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    return category;
  }

  async updateCategoryById(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.getCategoryById(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findByName(updateCategoryDto.name);

      if (existingCategory) {
        throw new HttpException('Category with this name already exists', HttpStatus.CONFLICT);
      }
    }

    return this.categoryRepository.update(id, updateCategoryDto);
  }

  async removeCategoryById(id: string): Promise<void> {
    await this.getCategoryById(id);
    await this.categoryRepository.remove(id);
  }

  async findByName(name: string): Promise<Category | null> {
    return this.categoryRepository.findByName(name);
  }
}
