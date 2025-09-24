import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

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
  @Column({ type: 'text' })
  phoneNumber!: string;

  @Column({ type: 'text' })
  firstName!: string;

  @Column({ type: 'text' })
  lastName!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ type: 'text' })
  codePostal!: string;

  @Column({ type: 'text' })
  city!: string;

  @Column({ type: 'text' })
  country!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: string;

  @Column({ nullable: true })
  @Column('text', { array: true, default: ['CUSTOMER'] })
  roles!: string[];

  @Column({ default: 'ACTIVE' })
  status!: 'ACTIVE' | 'SUSPENDED';

  @Column({ nullable: true })
  salesStatus?: 'OPEN' | 'FROZEN';

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
