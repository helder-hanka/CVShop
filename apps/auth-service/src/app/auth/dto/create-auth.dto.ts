import { Role } from '@cvshop/shared-dto';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
export class CreateAuthDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsEnum(Role, { each: true })
  roles?: Role[];
}
