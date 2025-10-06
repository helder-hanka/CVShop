import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type SalesStatus = 'OPEN' | 'FROZEN';
export const userEnum = ['ACTIVE', 'SUSPENDED'];
export const salesEnum = ['OPEN', 'FROZEN'];

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true, type: 'text' })
  avatarUrl?: string;
  @Column({ type: 'text', nullable: true })
  phoneNumber!: string;

  @Column({ type: 'text', nullable: true })
  firstName!: string;

  @Column({ type: 'text', nullable: true })
  lastName!: string;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column({ type: 'text', nullable: true })
  codePostal!: string;

  @Column({ type: 'text', nullable: true })
  city!: string;

  @Column({ type: 'text', nullable: true })
  country!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true })
  @Column('text', { array: true, default: ['CUSTOMER'] })
  roles!: string[];

  @Column({ type: 'enum', enum: userEnum, default: 'ACTIVE' })
  status!: UserStatus;

  @Column({ type: 'enum', enum: salesEnum, default: 'OPEN' })
  salesStatus!: SalesStatus;

  @Column({ default: false })
  isSuperAdmin!: boolean;

  @Column({ default: false })
  emailVerified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
