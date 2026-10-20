import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { AppModule } from './../src/app.module';

const PASSWORD = 'Str0ng!Pass';

describe('Task API (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;

  const register = async (name: string, email: string) => {
    const res = await http
      .post('/auth/register')
      .send({ name, email, password: PASSWORD })
      .expect(201);
    return res.body.accessToken as string;
  };

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirror the global setup from main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Start every run from a clean schema built from the entities.
    await app.get(DataSource).synchronize(true);

    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('GET /', () => {
    it('returns Hello World!', async () => {
      await http.get('/').expect(200).expect('Hello World!');
    });
  });

  describe('Auth', () => {
    const email = 'alice@example.com';

    it('registers a user and returns an access token', async () => {
      const token = await register('Alice', email);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('rejects a duplicate email with 409', async () => {
      await http
        .post('/auth/register')
        .send({ name: 'Alice 2', email, password: PASSWORD })
        .expect(409);
    });

    it('rejects an invalid payload with 400', async () => {
      await http
        .post('/auth/register')
        .send({ name: 'Bad', email: 'not-an-email', password: 'weak' })
        .expect(400);
    });

    it('logs in with valid credentials', async () => {
      const res = await http
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it('rejects a wrong password with 401', async () => {
      await http
        .post('/auth/login')
        .send({ email, password: 'Wr0ng!Pass' })
        .expect(401);
    });

    it('rejects an unknown email with 401', async () => {
      await http
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: PASSWORD })
        .expect(401);
    });
  });

  describe('Boards', () => {
    let owner: string;
    let stranger: string;
    let boardId: string;

    beforeAll(async () => {
      owner = await register('Board Owner', 'board-owner@example.com');
      stranger = await register('Stranger', 'board-stranger@example.com');
    });

    it('requires authentication', async () => {
      await http.get('/boards').expect(401);
    });

    it('creates a board', async () => {
      const res = await http
        .post('/boards')
        .set(auth(owner))
        .send({ name: 'Work' })
        .expect(201);
      expect(res.body).toMatchObject({ id: expect.any(String), name: 'Work' });
      boardId = res.body.id;
    });

    it('validates the board name', async () => {
      await http.post('/boards').set(auth(owner)).send({ name: '' }).expect(400);
    });

    it("lists only the user's boards", async () => {
      const mine = await http.get('/boards').set(auth(owner)).expect(200);
      expect(mine.body).toEqual([expect.objectContaining({ id: boardId })]);

      const theirs = await http.get('/boards').set(auth(stranger)).expect(200);
      expect(theirs.body).toEqual([]);
    });

    it('gets an owned board', async () => {
      const res = await http.get(`/boards/${boardId}`).set(auth(owner)).expect(200);
      expect(res.body).toMatchObject({ id: boardId, name: 'Work' });
    });

    it("forbids access to another user's board", async () => {
      await http.get(`/boards/${boardId}`).set(auth(stranger)).expect(403);
      await http
        .patch(`/boards/${boardId}`)
        .set(auth(stranger))
        .send({ name: 'Hacked' })
        .expect(403);
      await http.delete(`/boards/${boardId}`).set(auth(stranger)).expect(403);
    });

    it('returns 404 for a missing board', async () => {
      await http
        .get('/boards/00000000-0000-0000-0000-000000000000')
        .set(auth(owner))
        .expect(404);
    });

    it('updates a board', async () => {
      const res = await http
        .patch(`/boards/${boardId}`)
        .set(auth(owner))
        .send({ name: 'Personal' })
        .expect(200);
      expect(res.body).toMatchObject({ id: boardId, name: 'Personal' });
    });

    it('deletes a board', async () => {
      await http.delete(`/boards/${boardId}`).set(auth(owner)).expect(204);
      await http.get(`/boards/${boardId}`).set(auth(owner)).expect(404);
    });
  });

  describe('Tasks', () => {
    let owner: string;
    let stranger: string;
    let boardId: string;
    let taskId: string;

    beforeAll(async () => {
      owner = await register('Task Owner', 'task-owner@example.com');
      stranger = await register('Task Stranger', 'task-stranger@example.com');
      const res = await http
        .post('/boards')
        .set(auth(owner))
        .send({ name: 'Tasks board' })
        .expect(201);
      boardId = res.body.id;
    });

    it('requires authentication', async () => {
      await http.get(`/boards/${boardId}/tasks`).expect(401);
    });

    it('creates a task with defaults', async () => {
      const res = await http
        .post(`/boards/${boardId}/tasks`)
        .set(auth(owner))
        .send({ title: 'Write tests', priority: 'high' })
        .expect(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        title: 'Write tests',
        priority: 'high',
      });
      taskId = res.body.id;
    });

    it('validates the task payload', async () => {
      await http
        .post(`/boards/${boardId}/tasks`)
        .set(auth(owner))
        .send({ title: '', priority: 'urgent' })
        .expect(400);
    });

    it("forbids creating tasks on another user's board", async () => {
      await http
        .post(`/boards/${boardId}/tasks`)
        .set(auth(stranger))
        .send({ title: 'Nope' })
        .expect(403);
    });

    it('lists tasks with pagination and filters', async () => {
      await http
        .post(`/boards/${boardId}/tasks`)
        .set(auth(owner))
        .send({ title: 'Low prio', priority: 'low' })
        .expect(201);

      const all = await http
        .get(`/boards/${boardId}/tasks`)
        .set(auth(owner))
        .expect(200);
      expect(all.body).toMatchObject({ total: 2, page: 1, limit: 10 });
      expect(all.body.items).toHaveLength(2);

      const filtered = await http
        .get(`/boards/${boardId}/tasks`)
        .query({ priority: 'high' })
        .set(auth(owner))
        .expect(200);
      expect(filtered.body.total).toBe(1);
      expect(filtered.body.items[0]).toMatchObject({ id: taskId });

      const paged = await http
        .get(`/boards/${boardId}/tasks`)
        .query({ page: 2, limit: 1 })
        .set(auth(owner))
        .expect(200);
      expect(paged.body).toMatchObject({ total: 2, page: 2, limit: 1 });
      expect(paged.body.items).toHaveLength(1);
    });

    it('rejects invalid query params', async () => {
      await http
        .get(`/boards/${boardId}/tasks`)
        .query({ limit: 500 })
        .set(auth(owner))
        .expect(400);
    });

    it('updates a task', async () => {
      const res = await http
        .patch(`/tasks/${taskId}`)
        .set(auth(owner))
        .send({ status: 'done', title: 'Tests written' })
        .expect(200);
      expect(res.body).toMatchObject({
        id: taskId,
        status: 'done',
        title: 'Tests written',
      });
    });

    it("forbids changing another user's task", async () => {
      await http
        .patch(`/tasks/${taskId}`)
        .set(auth(stranger))
        .send({ title: 'Hacked' })
        .expect(403);
      await http.delete(`/tasks/${taskId}`).set(auth(stranger)).expect(403);
    });

    it('deletes a task', async () => {
      await http.delete(`/tasks/${taskId}`).set(auth(owner)).expect(204);
      await http.delete(`/tasks/${taskId}`).set(auth(owner)).expect(404);
    });
  });
});
