import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ example: 'iPhone 15 Pro', required: false })
  name?: string;

  @ApiProperty({ example: 'Latest iPhone with advanced features', required: false })
  description?: string;

  @ApiProperty({ example: 999.99, required: false })
  price?: number;

  @ApiProperty({ example: 50, required: false })
  stock?: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  categoryId?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  imageUrl?: string;
}