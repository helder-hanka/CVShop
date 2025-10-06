import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ListUsersDto } from './dto/create-admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query() query: ListUsersDto) {
    console.log('List users with filters:', query);
    return this.adminService.listUsers(query);
  }
}
