import { Entity, Column, OneToMany } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Order, order => order.user)
  orders: Order[];
}