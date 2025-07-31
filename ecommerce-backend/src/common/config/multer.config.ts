import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export const multerConfig = {
  storage: diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: Function) => {
      const uploadPath = join(process.cwd(), 'uploads');
      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb: Function) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtName = extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtName}`);
    },
  }),
  fileFilter: (req: Request, file: Express.Multer.File, cb: Function) => {
    if (file.fieldname === 'image') {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
    } else if (file.fieldname === 'file') {
      if (!file.mimetype.match(/\/(csv|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/)) {
        return cb(new BadRequestException('Only CSV and Excel files are allowed!'), false);
      }
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};