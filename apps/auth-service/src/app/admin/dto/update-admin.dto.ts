import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminDto } from './create-admin.dto';
import { IsEnum } from 'class-validator';
import { SalesStatus, UserStatus } from '@cvshop/shared-dto';
import { Transform } from 'class-transformer';

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}

export class UpdateSalesStatusDto {
  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(SalesStatus, {
    message: `salesStatus must be one of: ${Object.values(SalesStatus).join(
      ', '
    )}`,
  })
  salesStatus!: SalesStatus;

  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(UserStatus, {
    message: `status must be one of: ${Object.values(UserStatus).join(', ')}`,
  })
  status!: UserStatus;
}
