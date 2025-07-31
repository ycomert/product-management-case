import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class OrderFilterDto {
  @ApiProperty({ 
    required: false, 
    enum: OrderStatus,
    example: OrderStatus.PENDING 
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ required: false, example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ required: false, example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({ 
    required: false, 
    example: 'createdAt', 
    enum: ['createdAt', 'totalAmount', 'status'] 
  })
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({ 
    required: false, 
    example: 'DESC', 
    enum: ['ASC', 'DESC'] 
  })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}