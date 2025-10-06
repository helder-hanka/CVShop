import { Controller, Get, Param, Post, Query, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ListUsersDto } from './dto/create-admin.dto';
import { UpdateSalesStatusDto } from './dto/update-admin.dto';

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
