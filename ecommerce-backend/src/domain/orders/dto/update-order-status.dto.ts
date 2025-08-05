import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../enums';

export class UpdateOrderStatusDto {
  @ApiProperty({ 
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
    description: 'New status for the order'
  })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}