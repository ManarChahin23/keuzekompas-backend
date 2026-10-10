import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();

    if (name.length < 2) {
      throw new BadRequestException('Vul een geldige naam in.');
    }

    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new BadRequestException('Het wachtwoord is te lang.');
    }

    const passwordHash = await hash(dto.password, 12);

    try {
      return await this.prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: Role.STUDENT,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Dit e-mailadres is al geregistreerd.');
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new UnauthorizedException('E-mailadres of wachtwoord is onjuist.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('E-mailadres of wachtwoord is onjuist.');
    }

    const passwordCorrect = await compare(dto.password, user.passwordHash);

    if (!passwordCorrect) {
      throw new UnauthorizedException('E-mailadres of wachtwoord is onjuist.');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
