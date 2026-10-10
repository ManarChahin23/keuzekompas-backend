import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { VkmModule } from './vkm/vkm.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SavedModulesModule } from './saved-modules/saved-modules.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/keuzekompas',
    ),

    PrismaModule,
    AuthModule,
    VkmModule,
    SavedModulesModule,
  ],
})
export class AppModule {}
