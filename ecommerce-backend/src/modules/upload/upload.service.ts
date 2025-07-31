import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { existsSync, unlinkSync, createReadStream } from 'fs';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { UploadResponseDto, BulkUploadResponseDto, BulkUploadResult } from '../../dto/upload';

interface ProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryName: string;
  imageUrl?: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private configService: ConfigService,
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
  ) {}

  async uploadImage(file: Express.Multer.File): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3000';
    const filePath = `/uploads/${file.filename}`;
    const fullUrl = `${baseUrl}${filePath}`;

    return {
      filename: file.filename,
      path: filePath,
      mimetype: file.mimetype,
      size: file.size,
      url: fullUrl,
    };
  }

  async processBulkUpload(file: Express.Multer.File): Promise<BulkUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let productData: ProductData[];

    try {
      if (file.mimetype === 'text/csv') {
        productData = await this.parseCSV(file.path);
      } else if (file.mimetype.includes('sheet') || file.mimetype.includes('excel')) {
        productData = await this.parseExcel(file.path);
      } else {
        throw new BadRequestException('Unsupported file format');
      }

      const results = await this.createProductsFromData(productData);
      const response = this.generateUploadResponse(results);

      // Generate report file
      if (response.errorCount > 0) {
        response.reportFilename = await this.generateErrorReport(results);
      }

      // Clean up uploaded file
      this.cleanupFile(file.path);

      return response;
    } catch (error) {
      this.logger.error(`Bulk upload failed: ${error.message}`);
      this.cleanupFile(file.path);
      throw new BadRequestException(`Bulk upload failed: ${error.message}`);
    }
  }

  private async parseCSV(filePath: string): Promise<ProductData[]> {
    return new Promise((resolve, reject) => {
      const results: ProductData[] = [];
      const stream = createReadStream(filePath);

      stream
        .pipe(csvParser({
          mapHeaders: ({ header }) => header.trim().toLowerCase()
        }))
        .on('data', (data) => {
          try {
            const productData = this.validateAndTransformProductData(data);
            results.push(productData);
          } catch (error) {
            this.logger.warn(`Invalid row data: ${JSON.stringify(data)}, Error: ${error.message}`);
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private async parseExcel(filePath: string): Promise<ProductData[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: ''
      });

      if (jsonData.length < 2) {
        throw new BadRequestException('Excel file must contain headers and at least one data row');
      }

      const headers = (jsonData[0] as string[]).map(h => h.toString().trim().toLowerCase());
      const results: ProductData[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        const rowData: any = {};
        
        headers.forEach((header, index) => {
          rowData[header] = row[index] || '';
        });

        try {
          const productData = this.validateAndTransformProductData(rowData);
          results.push(productData);
        } catch (error) {
          this.logger.warn(`Invalid row ${i + 1}: ${JSON.stringify(rowData)}, Error: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      throw new BadRequestException(`Failed to parse Excel file: ${error.message}`);
    }
  }

  private validateAndTransformProductData(data: any): ProductData {
    const requiredFields = ['name', 'description', 'price', 'stock', 'categoryname'];
    
    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const price = parseFloat(data.price);
    const stock = parseInt(data.stock, 10);

    if (isNaN(price) || price < 0) {
      throw new Error('Invalid price value');
    }

    if (isNaN(stock) || stock < 0) {
      throw new Error('Invalid stock value');
    }

    return {
      name: data.name.toString().trim(),
      description: data.description.toString().trim(),
      price,
      stock,
      categoryName: data.categoryname.toString().trim(),
      imageUrl: data.imageurl ? data.imageurl.toString().trim() : undefined,
    };
  }

  private async createProductsFromData(productData: ProductData[]): Promise<BulkUploadResult[]> {
    const results: BulkUploadResult[] = [];

    for (const data of productData) {
      try {
        // Find or create category
        let category = await this.categoriesService.findByName(data.categoryName);
        
        if (!category) {
          category = await this.categoriesService.create({
            name: data.categoryName,
            description: `Auto-created category for ${data.categoryName}`,
          });
        }

        // Create product
        const product = await this.productsService.create({
          name: data.name,
          description: data.description,
          price: data.price,
          stock: data.stock,
          categoryId: category.id,
          imageUrl: data.imageUrl,
        });

        results.push({
          name: data.name,
          success: true,
          message: 'Product created successfully',
          productId: product.id,
        });

      } catch (error) {
        results.push({
          name: data.name,
          success: false,
          message: 'Failed to create product',
          error: error.message,
        });
      }
    }

    return results;
  }

  private generateUploadResponse(results: BulkUploadResult[]): BulkUploadResponseDto {
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return {
      totalProcessed: results.length,
      successCount,
      errorCount,
      results,
    };
  }

  private async generateErrorReport(results: BulkUploadResult[]): Promise<string> {
    const errorResults = results.filter(r => !r.success);
    
    if (errorResults.length === 0) {
      return '';
    }

    const timestamp = Date.now();
    const filename = `error-report-${timestamp}.csv`;
    const filePath = join(process.cwd(), 'uploads', filename);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'name', title: 'Product Name' },
        { id: 'message', title: 'Status' },
        { id: 'error', title: 'Error Details' },
      ],
    });

    await csvWriter.writeRecords(errorResults);
    return filename;
  }

  private cleanupFile(filePath: string): void {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        this.logger.log(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup file ${filePath}: ${error.message}`);
    }
  }

  async downloadTemplate(): Promise<string> {
    const templateData = [
      {
        name: 'Sample Product 1',
        description: 'This is a sample product description',
        price: 99.99,
        stock: 100,
        categoryName: 'Electronics',
        imageUrl: 'https://example.com/image1.jpg'
      },
      {
        name: 'Sample Product 2',
        description: 'Another sample product description',
        price: 149.99,
        stock: 50,
        categoryName: 'Clothing',
        imageUrl: 'https://example.com/image2.jpg'
      }
    ];

    const timestamp = Date.now();
    const filename = `product-template-${timestamp}.csv`;
    const filePath = join(process.cwd(), 'uploads', filename);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'name', title: 'name' },
        { id: 'description', title: 'description' },
        { id: 'price', title: 'price' },
        { id: 'stock', title: 'stock' },
        { id: 'categoryName', title: 'categoryName' },
        { id: 'imageUrl', title: 'imageUrl' },
      ],
    });

    await csvWriter.writeRecords(templateData);
    return filename;
  }

  getFilePath(filename: string): string {
    return join(process.cwd(), 'uploads', filename);
  }
}
