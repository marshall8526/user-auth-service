import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Database, DATABASE_CONNECTION } from '../src/database/types';
import { users } from '../src/database/schema';
import { eq } from 'drizzle-orm';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let createdUserId: number;
  let db: Database;

  const testUser = {
    username: `testuser${Date.now()}_${Math.random().toString(36).substring(7)}`,
    email: `test${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,
    password: 'TestPassword123!',
    fullName: 'Test User'
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    
    db = moduleFixture.get<Database>(DATABASE_CONNECTION);
  });

  afterAll(async () => {
    if (createdUserId) {
      try {
        await db.delete(users).where(eq(users.id, createdUserId));
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('fullName', testUser.fullName);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).not.toHaveProperty('password');

      createdUserId = response.body.id;
    });

    it('should return 400 for invalid email', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email',
        username: `different${Date.now()}`
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should return 400 for weak password', async () => {
      const weakPasswordUser = {
        ...testUser,
        password: '123',
        username: `weakpass${Date.now()}`,
        email: `weak${Date.now()}@example.com`
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordUser)
        .expect(400);
    });

    it('should return 409 for duplicate username', async () => {
      const duplicateUser = {
        ...testUser,
        email: `different${Date.now()}@example.com`
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(duplicateUser)
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');

      accessToken = response.body.access_token;
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should return 401 for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword'
        })
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdUserId);
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('fullName', testUser.fullName);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
