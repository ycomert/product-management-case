import { Injectable } from '@nestjs/common';
import { User } from './repository/entity/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { UserRepositoryService } from './repository/user.repository.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private userRepositoryService: UserRepositoryService,
  ) {}

  async createUser(registerDto: RegisterDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    return this.userRepositoryService.create({
      ...registerDto,
      password: hashedPassword,
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepositoryService.findByEmail(email);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepositoryService.findById(id);
  }
}
