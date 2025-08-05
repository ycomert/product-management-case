import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query,
  UseGuards,
  ParseUUIDPipe 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/enums';
import { OrderStatus } from './enums';
import { User } from '../users/repository/entity/user.entity';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order successfully created' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid data' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  createOrder(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: User) {
    return this.ordersService.createOrder(createOrderDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders (filtered by user role)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (createdAt, totalAmount, status)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (ASC, DESC)' })
  listOrders(@Query() filterDto: OrderFilterDto, @CurrentUser() user: User) {
    return this.ordersService.listOrders(filterDto, user);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get order statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order statistics retrieved successfully' })
  getOrderStats() {
    return this.ordersService.getOrderStats();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get current user order history' })
  @ApiResponse({ status: 200, description: 'Order history retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  getUserHistory(@Query() filterDto: OrderFilterDto, @CurrentUser() user: User) {
    return this.ordersService.getUserOrderHistory(user.id, filterDto);
  }

  @Get('status/:status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get orders by status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  getOrdersByStatus(@Param('status') status: OrderStatus) {
    return this.ordersService.getOrdersByStatus(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this order' })
  getOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.ordersService.getOrderById(id, user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order status successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @CurrentUser() user: User
  ) {
    return this.ordersService.updateOrderStatus(id, updateOrderStatusDto, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order successfully cancelled' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled at this stage' })
  @ApiResponse({ status: 403, description: 'Access denied to cancel this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancelOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.ordersService.cancelOrder(id, user);
  }
}
