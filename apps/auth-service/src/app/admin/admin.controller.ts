import { Controller, Get, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ListUsersDto } from './dto/create-admin.dto';

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
}
