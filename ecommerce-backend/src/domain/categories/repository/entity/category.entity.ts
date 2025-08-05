import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../common/entity/base.entity';
import { Product } from '../../../products/repository/entity/product.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Product, product => product.category)
  products: Product[];
}