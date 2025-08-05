import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../users/enums';

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ 
    example: 'customer',
    enum: ['customer', 'admin'],
    description: 'User role. Available values: customer | admin. Defaults to customer if not specified.',
    required: false,
    default: 'customer'
  })
  @IsEnum(UserRole, { message: 'Role must be either customer or admin' })
  @IsOptional()
  role?: UserRole = UserRole.CUSTOMER;
}