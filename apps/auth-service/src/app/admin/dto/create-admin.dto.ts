import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Role } from '@cvshop/shared-dto';

type UserStatus = 'ACTIVE' | 'SUSPENDED';
type SalesStatus = 'OPEN' | 'FROZEN';

export class CreateAdminDto {}

export class ListUsersDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isSuperAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  emailVerified?: boolean;

  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED'] as const)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(['OPEN', 'FROZEN'] as const)
  salesStatus?: SalesStatus;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  // pagination (optionnelle) - 20 par page
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  // forçage de la taille à 20 mais on laisse le champ si tu veux l'exposer plus tard
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}
