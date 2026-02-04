import { GenericContainer } from 'testcontainers';
import { beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';

let redisContainer;
let server;
let request;

beforeAll(async () => {
  // 1️⃣ Start Redis
  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  const redisPort = redisContainer.getMappedPort(6379);
  const redisHost = redisContainer.getHost();

  // 2️⃣ Inject env
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0'; // ephemeral
  process.env.REDIS_URL = `redis://${redisHost}:${redisPort}`;
  process.env.ADMIN_SECRET = 'test-admin-secret';

  // 3️⃣ Import app AFTER env is ready
  const { createServer } = await import('../src/server.js');

  server = await createServer();
  request = supertest(server);
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  if (redisContainer) {
    await redisContainer.stop();
  }
});

export { request };
