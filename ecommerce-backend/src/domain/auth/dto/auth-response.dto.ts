import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/enums';

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}