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

export class CreateProfileUsersDto {
  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  // @ApiProperty({ required: false, format: 'binary' })
  // @IsString()
  // @IsOptional()
  // avatarUrl?: string;
  @ApiProperty({ required: false, format: 'binary', type: 'string' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty()
  @IsString()
  phoneNumber!: string;

  @ApiProperty()
  @IsString()
  address!: string;

  @ApiProperty()
  @IsString()
  codePostal!: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty()
  @IsString()
  country!: string;

  @ApiProperty({ required: false })
  dateOfBirth?: Date;
}
