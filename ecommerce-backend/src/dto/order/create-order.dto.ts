import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ 
    type: [CreateOrderItemDto],
    example: [
      { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2 },
      { productId: '987fcdeb-51d3-12d3-a456-426614174000', quantity: 1 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ example: '123 Main St, City, State, 12345' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  shippingAddress: string;

  @ApiProperty({ example: 'Please call when arrived', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}