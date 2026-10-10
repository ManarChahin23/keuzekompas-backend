import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { Vkm } from '../models/vkm.schema';
import { PrismaService } from '../prisma/prisma.service';
import { SavedModulesService } from './saved-modules.service';

describe('SavedModulesService', () => {
  let service: SavedModulesService;

  const userId = 'test-user-1';
  const moduleId = '68eaecc7f4e3ce924a3477a';
  const createdAt = new Date('2026-10-08T00:00:00Z');

  const savedRecord = {
    id: 'saved-record-1',
    moduleId,
    createdAt,
  };

  const prismaMock = {
    savedModule: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const execMock = jest.fn();
  const leanMock = jest.fn();

  const modulesMock = {
    exists: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    leanMock.mockReturnValue({ exec: execMock });
    modulesMock.find.mockReturnValue({ lean: leanMock });

    const testModule = await Test.createTestingModule({
      providers: [
        SavedModulesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: getModelToken(Vkm.name),
          useValue: modulesMock,
        },
      ],
    }).compile();

    service = testModule.get(SavedModulesService);
  });

  describe('save', () => {
    it('bewaart een bestaande module en normaliseert de module-ID', async () => {
      modulesMock.exists.mockResolvedValue({ _id: moduleId });
      prismaMock.savedModule.create.mockResolvedValue(savedRecord);

      const result = await service.save(userId, moduleId.toUpperCase());

      expect(result).toEqual(savedRecord);
      expect(modulesMock.exists).toHaveBeenCalledWith({
        _id: moduleId,
      });
      expect(prismaMock.savedModule.create).toHaveBeenCalledWith({
        data: { userId, moduleId },
        select: {
          id: true,
          moduleId: true,
          createdAt: true,
        },
      });
    });

    it('weigert een module die niet bestaat', async () => {
      modulesMock.exists.mockResolvedValue(null);

      await expect(service.save(userId, moduleId)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(prismaMock.savedModule.create).not.toHaveBeenCalled();
    });

    it('geeft een conflict bij een dubbele bewaarde module', async () => {
      modulesMock.exists.mockResolvedValue({ _id: moduleId });

      prismaMock.savedModule.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Duplicate', {
          code: 'P2002',
          clientVersion: '6.19.0',
        }),
      );

      await expect(service.save(userId, moduleId)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('geeft een onverwachte databasefout door', async () => {
      modulesMock.exists.mockResolvedValue({ _id: moduleId });

      const databaseError = new Error('Database niet bereikbaar');
      prismaMock.savedModule.create.mockRejectedValue(databaseError);

      await expect(service.save(userId, moduleId)).rejects.toBe(databaseError);
    });
  });

  describe('findMine', () => {
    it('filtert op de gebruiker en koppelt de modulegegevens', async () => {
      prismaMock.savedModule.findMany.mockResolvedValue([savedRecord]);
      execMock.mockResolvedValue([
        {
          _id: moduleId,
          name: 'Psychologie',
          shortdescription: 'Korte beschrijving',
          description: 'Lange beschrijving',
          location: 'Den Bosch',
          level: 'NLQF6',
          ec: 30,
        },
      ]);

      const result = await service.findMine(userId);

      expect(prismaMock.savedModule.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          moduleId: true,
          createdAt: true,
        },
      });

      expect(modulesMock.find).toHaveBeenCalledWith({
        _id: { $in: [moduleId] },
      });

      expect(result).toEqual([
        {
          ...savedRecord,
          module: {
            _id: moduleId,
            name: 'Psychologie',
            description: 'Korte beschrijving',
            location: 'Den Bosch',
            level: 'NLQF6',
            ec: 30,
          },
        },
      ]);
    });

    it('geeft een lege lijst als de gebruiker niets heeft bewaard', async () => {
      prismaMock.savedModule.findMany.mockResolvedValue([]);
      execMock.mockResolvedValue([]);

      await expect(service.findMine(userId)).resolves.toEqual([]);
    });

    it('geeft module null als de gekoppelde MongoDB-module ontbreekt', async () => {
      prismaMock.savedModule.findMany.mockResolvedValue([savedRecord]);
      execMock.mockResolvedValue([]);

      await expect(service.findMine(userId)).resolves.toEqual([
        {
          ...savedRecord,
          module: null,
        },
      ]);
    });
  });

  describe('remove', () => {
    it('beperkt verwijderen tot de opgegeven gebruiker en module', async () => {
      prismaMock.savedModule.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(userId, moduleId.toUpperCase());

      expect(prismaMock.savedModule.deleteMany).toHaveBeenCalledWith({
        where: { userId, moduleId },
      });

      expect(result).toEqual({
        message: 'Module uit jouw lijst verwijderd.',
      });
    });

    it('geeft een fout als de module niet in de eigen lijst staat', async () => {
      prismaMock.savedModule.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, moduleId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
