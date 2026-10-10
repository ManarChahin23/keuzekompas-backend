import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { VkmService } from '../services/vkm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeacherGuard } from '../auth/teacher.guard';

class CreateVkmDto {
  @IsOptional() @IsString() code?: string; // vrije "docentcode" (niet verplicht)
  @IsString() name!: string;
  @IsNumber() ec!: number;
  @IsIn(['NLQF-5', 'NLQF-6'])
  level!: 'NLQF-5' | 'NLQF-6';
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() learningOutcomes?: string;
}
class UpdateVkmDto extends PartialType(CreateVkmDto) {}

@Controller('vkm')
export class VkmController {
  constructor(private readonly service: VkmService) {}

  @Get()
  list(
    @Query('query') query?: string,
    @Query('ec') ec?: string,
    @Query('level') level?: string,
    @Query('name') name?: string,
    @Query('location') location?: string,
  ) {
    return this.service.findAll({
      query,
      ec: ec ? Number(ec) : undefined,
      level,
      name,
      location,
    });
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, TeacherGuard)
  create(@Body() dto: CreateVkmDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  update(@Param('id') id: string, @Body() dto: UpdateVkmDto) {
    return this.service.update(id, dto);
  }
}
