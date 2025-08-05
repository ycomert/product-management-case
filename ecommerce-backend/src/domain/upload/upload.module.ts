import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { ProductsModule } from '../products/products.module';
import { CategoryModule } from '../categories/category.module';
import { multerConfig } from '../../common/config/multer.config';

@Module({
  imports: [
    MulterModule.register(multerConfig),
    ProductsModule,
    CategoryModule,
  ],
  providers: [UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
