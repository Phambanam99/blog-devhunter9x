import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Role hierarchy: ADMIN > EDITOR > AUTHOR
        const roleHierarchy: Record<Role, number> = {
            ADMIN: 3,
            EDITOR: 2,
            AUTHOR: 1,
        };

        const userRoleLevel = roleHierarchy[user.role as Role] || 0;
        const minRequiredLevel = Math.min(
            ...requiredRoles.map((role) => roleHierarchy[role] || 0),
        );

        if (userRoleLevel < minRequiredLevel) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
