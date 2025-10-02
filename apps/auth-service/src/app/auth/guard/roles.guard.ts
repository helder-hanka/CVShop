import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@cvshop/shared-dto';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    ctx: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredRoles) return true;
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as {
      role: Role;
      status: 'ACTIVE' | 'SUSPENDED';
    };
    if (!user) throw new ForbiddenException('Not authenticated');
    if (user.status === 'SUSPENDED')
      throw new ForbiddenException(`Account ${user.status}`);
    return requiredRoles.includes(user.role);
  }
}
