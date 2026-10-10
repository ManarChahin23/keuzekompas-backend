import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ModuleIdDto {
  @ApiProperty({
    description: 'Het _id van een module uit MongoDB.',
    example: '68eaecc7f4e3ce924a3477a',
    pattern: '^[a-fA-F0-9]{24}$',
  })
  @IsMongoId()
  moduleId!: string;
}
