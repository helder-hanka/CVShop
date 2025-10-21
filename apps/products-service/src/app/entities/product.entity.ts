import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid') id!: string;

  // propriétaire du produit (User.id venant d'auth-service)
  @Index() @Column() sellerId!: string;

  @Column() title!: string;
  @Column({ type: 'text' }) description!: string;
  @Index() @Column('decimal', { precision: 12, scale: 2 }) price!: string; // stocké en string par TypeORM
  @Column({ default: true }) active!: boolean;

  @Column('text', { array: true, default: [] }) images!: string[];

  @ManyToOne(() => Category, { nullable: true }) category?: Category;
  @Index() @Column({ nullable: true }) categoryId?: string;

  @Column({ type: 'int', default: 0 }) stock!: number; // disponible
  @Column({ type: 'int', default: 0 }) reserved!: number; // réservé (orders en cours)

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
