import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';
import { ListUsersDto } from './dto/create-admin.dto';
import { UpdateSalesStatusDto } from './dto/update-admin.dto';

@Injectable()
export class AdminService {
  constructor(@InjectRepository(User) private users: Repository<User>) {}

  async listUsers(filters: ListUsersDto): Promise<Omit<User, 'password'>[]> {
    const {
      role,
      isSuperAdmin,
      emailVerified,
      status,
      salesStatus,
      city,
      country,
      page = 1,
      limit = 20,
    } = filters;

    const qb = this.users.createQueryBuilder('u');

    if (role) {
      qb.andWhere(':role = ANY (u.roles)', { role });
    }
    if (isSuperAdmin !== undefined) {
      qb.andWhere('u.isSuperAdmin = :isSuperAdmin', { isSuperAdmin });
    }
    if (emailVerified !== undefined) {
      qb.andWhere('u.emailVerified = :emailVerified', { emailVerified });
    }
    if (status) {
      qb.andWhere('u.status = :status', { status });
    }
    if (salesStatus) {
      qb.andWhere('u.salesStatus = :salesStatus', { salesStatus });
    }
    if (city) {
      qb.andWhere('u.city ILIKE :city', { city: `%${city}%` });
    }
    if (country) {
      qb.andWhere('u.country ILIKE :country', { country: `%${country}%` });
    }

    qb.orderBy('u.createdAt', 'DESC')
      .take(Math.min(limit, 20))
      .skip((page - 1) * Math.min(limit, 20));

    const users = await qb.getMany();
    if (users.length === 0) {
      throw new BadRequestException('No users found with the given filters');
    }
    return users.map(({ password, ...rest }) => rest);
  }

  async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const { password, ...rest } = user;
    return rest;
  }

  async setSalesStatusStatus(
    id: string,
    set: UpdateSalesStatusDto
  ): Promise<Omit<User, 'password'>> {
    const { salesStatus, status } = set;
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.salesStatus = salesStatus;
    user.status = status;
    await this.users.save(user);
    const { password, ...rest } = user;
    return rest;
  }
}
