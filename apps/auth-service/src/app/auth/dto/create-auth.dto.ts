import { Role } from '@cvshop/shared-dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
export class CreateAuthDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: Role, isArray: true })
  @IsOptional()
  @IsEnum(Role, { each: true })
  roles?: Role[];
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
