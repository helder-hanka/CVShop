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
import { Role, SalesStatus, UserStatus } from '@cvshop/shared-dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {}

export class ListUsersDto {
  @ApiProperty({ enum: Role, isArray: true })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ enum: UserStatus })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isSuperAdmin?: boolean;

  @ApiProperty({ enum: UserStatus })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  emailVerified?: boolean;

  @ApiProperty({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ enum: SalesStatus })
  @IsOptional()
  @IsEnum(SalesStatus)
  salesStatus?: SalesStatus;

  @ApiProperty()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  country?: string;

  // pagination (optionnelle) - 20 par page
  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  // forçage de la taille à 20 mais on laisse le champ si tu veux l'exposer plus tard
  @ApiProperty()
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}
