import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiProperty({ example: 'Electronics', required: false })
  name?: string;

  @ApiProperty({ example: 'Electronic devices and accessories', required: false })
  description?: string;
}