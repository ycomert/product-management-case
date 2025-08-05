import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderRepositoryService } from './order.repository.service';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],
  providers: [OrderRepositoryService],
  exports: [OrderRepositoryService],
})
export class OrderRepositoryModule {} 