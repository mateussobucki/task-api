import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load test-only settings. Values here override anything already in the
// environment so the e2e suite can never accidentally hit the dev database.
config({ path: resolve(__dirname, '../.env.test'), override: true, quiet: true });

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Create a .env.test file (see README) pointing to a dedicated test database.',
  );
}

// AppModule reads DATABASE_URL, so point it at the test database.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET ??= 'e2e-test-secret';

