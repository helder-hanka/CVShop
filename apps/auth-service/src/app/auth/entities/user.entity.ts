import { Role, SalesStatus, UserStatus } from '@cvshop/shared-dto';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
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

  @Column('text', { array: true, default: [Role.CUSTOMER] })
  roles!: Role[];

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ type: 'enum', enum: SalesStatus, default: SalesStatus.OPEN })
  salesStatus!: SalesStatus;

  @Column({ default: false })
  isSuperAdmin!: boolean;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdByAdminId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedByAdminId?: string | null;

  @ManyToOne(() => User, (u) => u.createdUsers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  createdByAdmin?: User;

  @OneToMany(() => User, (u) => u.createdByAdmin)
  createdUsers?: User[];

  @ManyToOne(() => User, (u) => u.updatedUsers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  updatedByAdmin?: User;

  @OneToMany(() => User, (u) => u.updatedByAdmin)
  updatedUsers?: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
