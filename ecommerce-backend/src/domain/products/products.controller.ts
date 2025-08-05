import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product successfully created' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in product name and description' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter' })
  @ApiQuery({ name: 'inStock', required: false, description: 'Filter by stock availability' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (name, price, createdAt, stock)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (ASC, DESC)' })
  listProducts(@Query() filterDto: ProductFilterDto) {
    return this.productsService.listProducts(filterDto);
  }

  @Get('low-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiResponse({ status: 200, description: 'Low stock products retrieved successfully' })
  @ApiQuery({ name: 'threshold', required: false, description: 'Stock threshold (default: 5)' })
  findLowStockProducts(@Query('threshold') threshold?: number) {
    return this.productsService.findLowStockProducts(threshold);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findByCategory(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.productsService.findByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product successfully updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product (soft delete)' })
  @ApiResponse({ status: 200, description: 'Product successfully deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  removeProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.removeProduct(id);
  }

  @Patch(':id/stock/increase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Increase product stock' })
  @ApiResponse({ status: 200, description: 'Stock successfully increased' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  increaseStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('quantity', ParseIntPipe) quantity: number
  ) {
    return this.productsService.increaseStock(id, quantity);
  }

  @Patch(':id/stock/decrease')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Decrease product stock' })
  @ApiResponse({ status: 200, description: 'Stock successfully decreased' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  decreaseStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('quantity', ParseIntPipe) quantity: number
  ) {
    return this.productsService.decreaseStock(id, quantity);
  }

  @Get(':id/stock/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if product has sufficient stock' })
  @ApiResponse({ status: 200, description: 'Stock check result' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  checkStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('quantity', ParseIntPipe) quantity: number
  ) {
    return this.productsService.checkStock(id, quantity);
  }
}
