import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthRequest } from './auth-request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      throw new UnauthorizedException('Een inlogtoken is vereist.');
    }

    let payload: Record<string, unknown>;

    try {
      payload = await this.jwt.verifyAsync<Record<string, unknown>>(match[1], {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException(
        'Het inlogtoken is ongeldig of verlopen.',
      );
    }

    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
      throw new UnauthorizedException('Het inlogtoken is ongeldig.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('De gebruiker bestaat niet meer.');
    }

    request.user = user;

    return true;
  }
}
