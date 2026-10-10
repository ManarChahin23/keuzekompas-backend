import { ApiProperty } from '@nestjs/swagger';

export class PublicUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Teststudent' })
  name!: string;

  @ApiProperty({ example: 'student@example.com' })
  email!: string;

  @ApiProperty({ enum: ['STUDENT', 'TEACHER'] })
  role!: 'STUDENT' | 'TEACHER';
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT voor de Authorization-header.',
  })
  access_token!: string;

  @ApiProperty({ type: PublicUserDto })
  user!: PublicUserDto;
}
