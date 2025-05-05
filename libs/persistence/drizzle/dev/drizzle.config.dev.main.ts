import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({
  path: `${process.env.PWD}/env/.env.dev`,
});

const SCHEMA_NAME = 'main';
const OUT_PATH = `./.drizzle/dev/database/${SCHEMA_NAME}`;

export default defineConfig({
  dialect: 'mysql',
  out: OUT_PATH,
  dbCredentials: {
    url: `${process.env.DATABASE_URI}/${SCHEMA_NAME}`,
    database: SCHEMA_NAME,
  },
});
