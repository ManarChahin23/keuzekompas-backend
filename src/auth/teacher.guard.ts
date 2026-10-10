import { ForbiddenException, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthRequest } from './auth-request';

@Injectable()
export class TeacherGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    if (request.user?.role !== Role.TEACHER) {
      throw new ForbiddenException(
        'Alleen een docent mag modules aanmaken of wijzigen.',
      );
    }

    return true;
  }
}
