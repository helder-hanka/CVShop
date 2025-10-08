import { Role } from '@cvshop/shared-dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
export class CreateAuthDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;
}

export class CreateUsersSellerAdminDto extends CreateAuthDto {
  @ApiProperty({ enum: Role, isArray: true, example: [Role.PLATFORM_ADMIN] })
  @IsOptional()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;
}

export class CreateAdminDto extends CreateAuthDto {
  @ApiProperty()
  @IsString()
  token!: string;
}
export class TokenRequestDto {
  @ApiProperty()
  @IsString()
  token!: string;
}
