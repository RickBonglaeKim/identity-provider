import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

const DATABASE_CONNECTION_MAIN = Symbol('database-connection-main-schema');

const mainConnection = {
  provide: DATABASE_CONNECTION_MAIN,
  useFactory(configService: ConfigService) {
    const SCHEMA_NAME = 'main';
    const poolConnection = mysql.createPool({
      uri: `${configService.getOrThrow<string>('DATABASE_URI')}/${SCHEMA_NAME}`,
      connectionLimit: configService.getOrThrow<number>(
        'MAIN_CONNECTION_LIMIT',
      ),
      maxIdle: configService.getOrThrow<number>('MAIN_MAX_IDLE'),
      idleTimeout: configService.getOrThrow<number>('DATABASE_IDLE_TIMEOUT'),
    });
    return drizzle({
      client: poolConnection,
    });
  },
  inject: [ConfigService],
};

export { DATABASE_CONNECTION_MAIN, mainConnection };
