import { 
  Controller, 
  Post, 
  Get,
  Param,
  UseInterceptors, 
  UploadedFile, 
  UseGuards,
  Res,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UploadResponseDto, BulkUploadResponseDto } from '../../dto/upload';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload product image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image uploaded successfully', type: UploadResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    return this.uploadService.uploadImage(file);
  }

  @Post('bulk-products')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk upload products from CSV/Excel (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Bulk upload processed', type: BulkUploadResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file format or processing error' })
  async bulkUploadProducts(@UploadedFile() file: Express.Multer.File): Promise<BulkUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.processBulkUpload(file);
  }

  @Get('template')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Download CSV template for bulk upload (Admin only)' })
  @ApiResponse({ status: 200, description: 'Template file downloaded' })
  async downloadTemplate(@Res() res: Response): Promise<void> {
    const filename = await this.uploadService.downloadTemplate();
    const filePath = this.uploadService.getFilePath(filename);
    
    res.download(filePath, 'product-template.csv', (err) => {
      if (err) {
        console.error('Error downloading template:', err);
      }
    });
  }

  @Get('error-report/:filename')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Download error report from bulk upload (Admin only)' })
  @ApiResponse({ status: 200, description: 'Error report downloaded' })
  async downloadErrorReport(@Param('filename') filename: string, @Res() res: Response): Promise<void> {
    const filePath = this.uploadService.getFilePath(filename);
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error downloading error report:', err);
        res.status(404).send('File not found');
      }
    });
  }
}
