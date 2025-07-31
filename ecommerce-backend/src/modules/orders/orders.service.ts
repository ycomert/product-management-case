import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { User } from '../../entities/user.entity';
import { CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto } from '../../dto/order';
import { ProductsService } from '../products/products.service';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private productsService: ProductsService,
    private dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    return this.dataSource.transaction(async (entityManager) => {
      let totalAmount = 0;
      const orderItems: Partial<OrderItem>[] = [];

      // Validate products and calculate total
      for (const item of createOrderDto.items) {
        const product = await this.productsService.findOne(item.productId);
        
        // Check stock availability
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }

        const itemTotal = Number(product.price) * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        });

        // Decrease stock
        await this.productsService.decreaseStock(item.productId, item.quantity);
      }

      // Create order
      const order = entityManager.create(Order, {
        userId: user.id,
        totalAmount,
        shippingAddress: createOrderDto.shippingAddress,
        notes: createOrderDto.notes,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await entityManager.save(Order, order);

      // Create order items
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        orderId: savedOrder.id,
      }));

      await entityManager.save(OrderItem, orderItemsWithOrderId);

      // Return order with relations
      const orderWithRelations = await entityManager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['orderItems', 'orderItems.product', 'user'],
      });

      if (!orderWithRelations) {
        throw new NotFoundException('Order not found after creation');
      }

      return orderWithRelations;
    });
  }

  async findAll(filterDto: OrderFilterDto, user?: User): Promise<PaginatedResult<Order>> {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = filterDto;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('order.user', 'user');

    // If user is customer, only show their orders
    if (user && user.role === UserRole.CUSTOMER) {
      queryBuilder.where('order.userId = :userId', { userId: user.id });
    }

    this.applyOrderFilters(queryBuilder, { status, startDate, endDate });

    const total = await queryBuilder.getCount();

    const validSortFields = ['createdAt', 'totalAmount', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    queryBuilder
      .orderBy(`order.${sortField}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private applyOrderFilters(
    queryBuilder: SelectQueryBuilder<Order>,
    filters: {
      status?: OrderStatus;
      startDate?: string;
      endDate?: string;
    }
  ): void {
    const { status, startDate, endDate } = filters;

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate });
    }
  }

  async findOne(id: string, user?: User): Promise<Order> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('order.user', 'orderUser')
      .where('order.id = :id', { id });

    // If user is customer, only allow access to their own orders
    if (user && user.role === UserRole.CUSTOMER) {
      queryBuilder.andWhere('order.userId = :userId', { userId: user.id });
    }

    const order = await queryBuilder.getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto, user: User): Promise<Order> {
    // Only admins can update order status
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update order status');
    }

    const order = await this.findOne(id);
    
    // Validate status transition
    this.validateStatusTransition(order.status, updateOrderStatusDto.status);

    order.status = updateOrderStatusDto.status;
    await this.orderRepository.save(order);

    return this.findOne(id);
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  async cancel(id: string, user: User): Promise<Order> {
    const order = await this.findOne(id, user);

    // Check if user can cancel this order
    if (user.role === UserRole.CUSTOMER && order.userId !== user.id) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    // Check if order can be cancelled
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    return this.dataSource.transaction(async (entityManager) => {
      // Restore stock for cancelled order
      for (const item of order.orderItems) {
        await this.productsService.increaseStock(item.productId, item.quantity);
      }

      // Update order status
      order.status = OrderStatus.CANCELLED;
      return entityManager.save(Order, order);
    });
  }

  async getUserOrderHistory(userId: string, filterDto: OrderFilterDto): Promise<PaginatedResult<Order>> {
    const userFilterDto = { ...filterDto };
    const user = { id: userId, role: UserRole.CUSTOMER } as User;
    
    return this.findAll(userFilterDto, user);
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepository.find({
      where: { status },
      relations: ['orderItems', 'orderItems.product', 'user'],
      order: { createdAt: 'DESC' }
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
      revenueResult
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
    ]);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: Number(revenueResult.total) || 0,
    };
  }
}
