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
  @ApiProperty({ enum: Role, isArray: true, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isSuperAdmin?: boolean;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  emailVerified?: boolean;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ enum: SalesStatus, required: false })
  @IsOptional()
  @IsEnum(SalesStatus)
  salesStatus?: SalesStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;
  // ApiProperty() is a optional decorator that adds metadata for Swagger documentation
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  // pagination (optionnelle) - 20 par page
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  // forçage de la taille à 20 mais on laisse le champ si tu veux l'exposer plus tard
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}
