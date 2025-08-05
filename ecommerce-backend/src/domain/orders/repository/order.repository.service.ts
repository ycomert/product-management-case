import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { OrderFilterDto } from '../dto/order-filter.dto';
import { OrderStatus } from '../enums';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class OrderRepositoryService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
  ) {}

  async create(data: Partial<Order>): Promise<Order> {
    const entity = this.orderRepository.create(data);
    return this.orderRepository.save(entity);
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderRepository.findOne({ 
      where: { id: id as any },
      relations: ['orderItems', 'orderItems.product', 'user']
    });
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({ 
      relations: ['orderItems', 'orderItems.product', 'user']
    });
  }

  async update(id: string, data: Partial<Order>): Promise<Order> {
    await this.orderRepository.update(id, data);
    const result = await this.findById(id);
    if (!result) {
      throw new Error('Order not found');
    }
    return result;
  }

  async remove(id: string): Promise<void> {
    await this.orderRepository.delete(id);
  }

  async findWithFilters(filters: OrderFilterDto, userId?: string): Promise<PaginatedResult<Order>> {
    const queryBuilder: SelectQueryBuilder<Order> = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('order.user', 'user');

    // If user is provided, filter by user
    if (userId) {
      queryBuilder.where('order.userId = :userId', { userId });
    }

    // Apply status filter
    if (filters.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }

    // Apply date filters
    if (filters.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const total = await queryBuilder.getCount();
    
    // Apply sorting
    const validSortFields = ['createdAt', 'totalAmount', 'status'];
    const sortField = validSortFields.includes(filters.sortBy || 'createdAt') ? filters.sortBy || 'createdAt' : 'createdAt';
    queryBuilder.orderBy(`order.${sortField}`, filters.sortOrder || 'DESC');

    // Apply pagination
    if (filters.page && filters.limit) {
      const skip = (filters.page - 1) * filters.limit;
      queryBuilder.skip(skip).take(filters.limit);
    }

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page: filters.page || 1,
      limit: filters.limit || total,
      totalPages: filters.limit ? Math.ceil(total / filters.limit) : 1,
    };
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepository.find({ 
      where: { status },
      relations: ['orderItems', 'orderItems.product', 'user']
    });
  }

  async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  }> {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue
    ] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
      this.orderRepository.count({ where: { status: OrderStatus.CONFIRMED } }),
      this.orderRepository.count({ where: { status: OrderStatus.SHIPPED } }),
      this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } }),
      this.orderRepository.count({ where: { status: OrderStatus.CANCELLED } }),
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'total')
        .where('order.status IN (:...statuses)', { 
          statuses: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED] 
        })
        .getRawOne()
        .then(result => parseFloat(result?.total || '0'))
    ]);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    };
  }

  async createOrderItem(data: Partial<OrderItem>): Promise<OrderItem> {
    const entity = this.orderItemRepository.create(data);
    return this.orderItemRepository.save(entity);
  }

  async findOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.orderItemRepository.find({ 
      where: { orderId },
      relations: ['product']
    });
  }
} 