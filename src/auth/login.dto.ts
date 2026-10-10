import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'student@example.com',
    format: 'email',
    maxLength: 254,
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'Testwachtwoord123!',
    format: 'password',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @Length(8, 72)
  password!: string;
}
