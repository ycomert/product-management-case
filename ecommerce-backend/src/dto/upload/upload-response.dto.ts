import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ example: 'image-1234567890-123456789.jpg' })
  filename: string;

  @ApiProperty({ example: '/uploads/image-1234567890-123456789.jpg' })
  path: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimetype: string;

  @ApiProperty({ example: 1024000 })
  size: number;

  @ApiProperty({ example: 'https://api.example.com/uploads/image-1234567890-123456789.jpg' })
  url: string;
}