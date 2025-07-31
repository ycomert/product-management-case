import { ApiProperty } from '@nestjs/swagger';

export class BulkUploadResult {
  @ApiProperty({ example: 'iPhone 15 Pro' })
  name: string;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Product created successfully' })
  message: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  productId?: string;

  @ApiProperty({ example: 'Category not found', required: false })
  error?: string;
}

export class BulkUploadResponseDto {
  @ApiProperty({ example: 10 })
  totalProcessed: number;

  @ApiProperty({ example: 8 })
  successCount: number;

  @ApiProperty({ example: 2 })
  errorCount: number;

  @ApiProperty({ type: [BulkUploadResult] })
  results: BulkUploadResult[];

  @ApiProperty({ example: 'upload-results-1234567890.csv' })
  reportFilename?: string;
}