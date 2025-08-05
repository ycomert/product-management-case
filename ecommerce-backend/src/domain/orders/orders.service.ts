import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from './repository/entity/order.entity';
import { OrderItem } from './repository/entity/order-item.entity';
import { User } from '../users/repository/entity/user.entity';
import { CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto } from './dto';
import { ProductsService } from '../products/products.service';
import { OrderStatus } from './enums';
import { UserRole } from '../users/enums';
import { OrderRepositoryService, PaginatedResult } from './repository/order.repository.service';

@Injectable()
export class OrdersService {
  constructor(
    private orderRepositoryService: OrderRepositoryService,
    private productsService: ProductsService,
    private dataSource: DataSource,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    return this.dataSource.transaction(async (entityManager) => {
      let totalAmount = 0;
      const orderItems: Partial<OrderItem>[] = [];

      // Validate products and calculate total
      for (const item of createOrderDto.items) {
        const product = await this.productsService.getProductById(item.productId);
        
        // Check stock availability
        if (product.stock < item.quantity) {
          throw new HttpException(
            `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
            HttpStatus.BAD_REQUEST
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
        where: { id: savedOrder.id as any },
        relations: ['orderItems', 'orderItems.product', 'user'],
      });

      if (!orderWithRelations) {
        throw new HttpException('Order not found after creation', HttpStatus.NOT_FOUND);
      }

      return orderWithRelations;
    });
  }

  async listOrders(filterDto: OrderFilterDto, user?: User): Promise<PaginatedResult<Order>> {
    const userId = user && user.role === UserRole.CUSTOMER ? user.id : undefined;
    return this.orderRepositoryService.findWithFilters(filterDto, userId);
  }



  async getOrderById(id: string, user?: User): Promise<Order> {
    const order = await this.orderRepositoryService.findById(id);
    
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    // If user is customer, only allow access to their own orders
    if (user && user.role === UserRole.CUSTOMER && order.userId !== user.id) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    return order;
  }

  async updateOrderStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto, user: User): Promise<Order> {
    // Only admins can update order status
    if (user.role !== UserRole.ADMIN) {
      throw new HttpException('Only administrators can update order status', HttpStatus.FORBIDDEN);
    }

    const order = await this.getOrderById(id);
    
    // Validate status transition
    this.validateStatusTransition(order.status, updateOrderStatusDto.status);

    return this.orderRepositoryService.update(id, { status: updateOrderStatusDto.status });
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
      throw new HttpException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async cancelOrder(id: string, user: User): Promise<Order> {
    const order = await this.getOrderById(id, user);

    // Check if user can cancel this order
    if (user.role === UserRole.CUSTOMER && order.userId !== user.id) {
      throw new HttpException('You can only cancel your own orders', HttpStatus.FORBIDDEN);
    }

    // Check if order can be cancelled
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new HttpException('Order cannot be cancelled at this stage', HttpStatus.BAD_REQUEST);
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
    
    return this.listOrders(userFilterDto, user);
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepositoryService.findByStatus(status);
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
    return this.orderRepositoryService.getOrderStats();
  }
}
