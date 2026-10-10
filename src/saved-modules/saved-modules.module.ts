import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Vkm, VkmSchema } from '../models/vkm.schema';
import { SavedModulesController } from './saved-modules.controller';
import { SavedModulesService } from './saved-modules.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Vkm.name, schema: VkmSchema }]),
  ],
  controllers: [SavedModulesController],
  providers: [SavedModulesService],
})
export class SavedModulesModule {}
