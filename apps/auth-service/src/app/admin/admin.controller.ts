import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ListUsersDto } from './dto/create-admin.dto';
import { UpdateSalesStatusDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@cvshop/shared-dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PLATFORM_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query() query: ListUsersDto) {
    return this.adminService.listUsers(query);
  }
  @Get('user/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('user/:id/sales-status')
  updateSalesStatus(
    @Param('id') id: string,
    @Body() body: UpdateSalesStatusDto
  ) {
    return this.adminService.setSalesStatusStatus(id, body);
  }
}
