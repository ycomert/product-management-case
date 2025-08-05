import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { UserRole } from '../enums';

@Injectable()
export class UserRepositoryService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const entity = this.userRepository.create(data);
    return this.userRepository.save(entity);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { id: id as any },
      relations: ['orders']
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['orders'] });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    const result = await this.findById(id);
    if (!result) {
      throw new Error('User not found');
    }
    return result;
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async findActiveUsers(): Promise<User[]> {
    return this.userRepository.find({ 
      where: { isActive: true },
      relations: ['orders']
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ 
      where: { role },
      relations: ['orders']
    });
  }

  async findCustomers(): Promise<User[]> {
    return this.findByRole(UserRole.CUSTOMER);
  }

  async findAdmins(): Promise<User[]> {
    return this.findByRole(UserRole.ADMIN);
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    customers: number;
    admins: number;
  }> {
    const [totalUsers, activeUsers, customers, admins] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { role: UserRole.CUSTOMER } }),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      customers,
      admins,
    };
  }
} 