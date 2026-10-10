import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import type { Model } from 'mongoose';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { Vkm } from '../src/models/vkm.schema';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Keuzekompas API (e2e)', () => {
  let app: INestApplication<Server> | undefined;
  let server: Server;
  let prisma: PrismaService;
  let modules: Model<Vkm>;
  let moduleId: string;
  let token1: string;
  let token2: string;

  const suffix = randomUUID();
  const email1 = `e2e-1-${suffix}@example.com`;
  const email2 = `e2e-2-${suffix}@example.com`;
  const password = 'Testwachtwoord123!';

  beforeAll(async () => {
    const fixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = fixture.createNestApplication<INestApplication<Server>>();

    // Dezelfde validatie als in main.ts.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    server = app.getHttpServer();
    prisma = app.get(PrismaService);
    modules = app.get<Model<Vkm>>(getModelToken(Vkm.name));

    const module = await modules.create({
      name: `E2E testmodule ${suffix}`,
      code: `E2E-${suffix}`,
      shortdescription: 'Tijdelijke module voor automatische tests.',
      location: 'Breda',
      level: 'NLQF6',
      ec: 30,
    });

    moduleId = String(module._id);

    await request(server)
      .post('/auth/register')
      .send({
        name: 'E2E student 1',
        email: email1,
        password,
      })
      .expect(201);

    await request(server)
      .post('/auth/register')
      .send({
        name: 'E2E student 2',
        email: email2,
        password,
      })
      .expect(201);

    const login1 = await request(server)
      .post('/auth/login')
      .send({ email: email1, password })
      .expect(200);

    const login2 = await request(server)
      .post('/auth/login')
      .send({ email: email2, password })
      .expect(200);

    token1 = (login1.body as { access_token: string }).access_token;
    token2 = (login2.body as { access_token: string }).access_token;

    expect(typeof token1).toBe('string');
    expect(typeof token2).toBe('string');
    expect(token1.length).toBeGreaterThan(0);
    expect(token2.length).toBeGreaterThan(0);
  }, 60000);

  afterAll(async () => {
    if (!app) return;

    try {
      if (modules && moduleId) {
        await modules.deleteOne({ _id: moduleId });
      }

      if (prisma) {
        // SavedModule-records verdwijnen door onDelete: Cascade.
        await prisma.user.deleteMany({
          where: {
            email: { in: [email1, email2] },
          },
        });
      }
    } finally {
      await app.close();
    }
  });

  it('weigert toegang zonder JWT', async () => {
    await request(server).get('/saved-modules').expect(401);
  });

  it('weigert een ongeldig JWT', async () => {
    await request(server)
      .get('/saved-modules')
      .set('Authorization', 'Bearer ongeldig-token')
      .expect(401);
  });

  it('weigert inloggen met een verkeerd wachtwoord', async () => {
    await request(server)
      .post('/auth/login')
      .send({
        email: email1,
        password: 'VerkeerdWachtwoord123!',
      })
      .expect(401);
  });

  it('geeft de juiste gebruiker terug bij een geldig JWT', async () => {
    const response = await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(response.body).toMatchObject({
      email: email1,
      role: 'STUDENT',
    });
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('weigert een ongeldige module-ID', async () => {
    await request(server)
      .post('/saved-modules')
      .set('Authorization', `Bearer ${token1}`)
      .send({ moduleId: 'abc' })
      .expect(400);
  });

  it('weigert een module die niet bestaat', async () => {
    // Nieuw ObjectId-formaat zonder bijbehorend document.
    const missingId = randomUUID().replaceAll('-', '').slice(0, 24);

    await request(server)
      .post('/saved-modules')
      .set('Authorization', `Bearer ${token1}`)
      .send({ moduleId: missingId })
      .expect(404);
  });

  it('test bewaren, eigen gegevens, dubbele keuzes en verwijderen', async () => {
    await request(server)
      .get('/saved-modules')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200)
      .expect([]);

    const saved = await request(server)
      .post('/saved-modules')
      .set('Authorization', `Bearer ${token1}`)
      .send({ moduleId })
      .expect(201);

    expect(saved.body).toMatchObject({ moduleId });
    const list = await request(server)
      .get('/saved-modules')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(list.body).toHaveLength(1);

    expect(list.body).toMatchObject([
      {
        moduleId,
        module: {
          _id: moduleId,
          name: `E2E testmodule ${suffix}`,
        },
      },
    ]);

    await request(server)
      .post('/saved-modules')
      .set('Authorization', `Bearer ${token1}`)
      .send({ moduleId })
      .expect(409);

    // Student 2 ziet de keuze van student 1 niet.
    await request(server)
      .get('/saved-modules')
      .set('Authorization', `Bearer ${token2}`)
      .expect(200)
      .expect([]);

    // Student 2 kan die keuze ook niet verwijderen.
    await request(server)
      .delete(`/saved-modules/${moduleId}`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(404);

    // De keuze van student 1 bestaat nog steeds.
    const stillSaved = await request(server)
      .get('/saved-modules')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(stillSaved.body).toEqual([expect.objectContaining({ moduleId })]);

    await request(server)
      .delete(`/saved-modules/${moduleId}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    await request(server)
      .delete(`/saved-modules/${moduleId}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(404);

    await request(server)
      .get('/saved-modules')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200)
      .expect([]);
  });
});
