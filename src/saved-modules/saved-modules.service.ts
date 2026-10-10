import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Prisma } from '@prisma/client';
import type { Model } from 'mongoose';
import { Vkm } from '../models/vkm.schema';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedModulesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(Vkm.name)
    private readonly modules: Model<Vkm>,
  ) {}

  async save(userId: string, moduleId: string) {
    const normalizedId = moduleId.toLowerCase();

    const exists = await this.modules.exists({
      _id: normalizedId,
    });

    if (!exists) {
      throw new NotFoundException('Deze module bestaat niet.');
    }

    try {
      return await this.prisma.savedModule.create({
        data: {
          userId,
          moduleId: normalizedId,
        },
        select: {
          id: true,
          moduleId: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Je hebt deze module al bewaard.');
      }

      throw error;
    }
  }

  async findMine(userId: string) {
    const saved = await this.prisma.savedModule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        moduleId: true,
        createdAt: true,
      },
    });

    const modules = await this.modules
      .find({
        _id: { $in: saved.map((item) => item.moduleId) },
      })
      .lean()
      .exec();

    const modulesById = new Map(
      modules.map((module) => [
        String(module._id),
        {
          _id: String(module._id),
          name: module.name,
          description: module.shortdescription ?? module.description ?? '',
          location: module.location ?? null,
          level: module.level ?? null,
          ec: module.ec ?? null,
        },
      ]),
    );

    return saved.map((item) => ({
      ...item,
      module: modulesById.get(item.moduleId) ?? null,
    }));
  }

  async remove(userId: string, moduleId: string) {
    const result = await this.prisma.savedModule.deleteMany({
      where: {
        userId,
        moduleId: moduleId.toLowerCase(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'Deze module staat niet in jouw bewaarde lijst.',
      );
    }

    return { message: 'Module uit jouw lijst verwijderd.' };
  }
}
