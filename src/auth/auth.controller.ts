import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from './auth-request';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { LoginResponseDto, PublicUserDto } from './auth-response.dto';

@ApiTags('Authenticatie')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Inloggen en een JWT ontvangen' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({
    description: 'De invoer voldoet niet aan de validatieregels.',
  })
  @ApiUnauthorizedResponse({
    description: 'E-mailadres of wachtwoord is onjuist.',
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gegevens van de ingelogde gebruiker ophalen' })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({
    description: 'JWT ontbreekt, is ongeldig of is verlopen.',
  })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthRequest) {
    return request.user;
  }
}
