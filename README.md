# Task API

A simple REST API for managing boards and tasks, built with [NestJS](https://nestjs.com/).

> This project was created as a learning practice for NestJS.

## Features

- User registration and login with JWT authentication
- Boards owned by users (create, list, view, update, delete)
- Tasks inside boards with status, priority and due date
- Filtering and pagination when listing tasks
- Request validation with `class-validator`
- PostgreSQL with TypeORM and migrations
- Swagger docs at `/docs`
- Unit and end-to-end tests with Jest and Supertest

## Tech stack

NestJS · TypeScript · TypeORM · PostgreSQL · Passport JWT · Jest

## Getting started

### Requirements

- Node.js 24+ (see `.nvmrc`)
- PostgreSQL (or Docker)

### Setup

```sh
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL=postgres://app:app@localhost:5432/tasks
JWT_SECRET=change-me
```

Start a database (optional, using the included `docker-compose.yaml`):

```sh
docker compose up -d
```

Run the migrations and start the app:

```sh
npm run typeorm -- migration:run -d src/data-source.ts
npm run start:dev
```

The API runs on `http://localhost:3000` and the Swagger docs are at `http://localhost:3000/docs`.

## Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Register a user and get a token |
| POST | `/auth/login` | Log in and get a token |
| GET | `/boards` | List your boards |
| POST | `/boards` | Create a board |
| GET | `/boards/:id` | Get a board |
| PATCH | `/boards/:id` | Update a board |
| DELETE | `/boards/:id` | Delete a board |
| GET | `/boards/:boardId/tasks` | List tasks (`status`, `priority`, `page`, `limit`) |
| POST | `/boards/:boardId/tasks` | Create a task |
| PATCH | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

All board and task routes need an `Authorization: Bearer <token>` header.

## Tests

```sh
npm test           # unit tests
npm run test:cov   # unit tests with coverage
npm run test:e2e   # end-to-end tests
```

The e2e tests need a separate database. Create a `.env.test` file:

```env
TEST_DATABASE_URL=postgres://app:app@localhost:5432/tasks_test
JWT_SECRET=e2e-test-secret
```

> The test database schema is dropped and recreated on every e2e run, so don't point it at real data.
