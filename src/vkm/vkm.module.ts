import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TeacherGuard } from '../auth/teacher.guard';
import { Vkm, VkmSchema } from '../models/vkm.schema';
import { VkmService } from '../services/vkm.service';
import { VkmController } from '../controllers/vkm.controller';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Vkm.name, schema: VkmSchema }]),
  ],
  providers: [VkmService, TeacherGuard],
  controllers: [VkmController],
})
export class VkmModule {}
