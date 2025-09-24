import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
  Column,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string; //jti

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Index()
  @Column()
  userId!: string;

  @Column({ default: false })
  isRevoked!: boolean;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column()
  createdAt!: Date;
}
