import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as mainSchema from '../../../database-schema/main/schema';
import { DATABASE_CONNECTION_MAIN } from '@app/persistence/persistence.connection.main';

type MainSchema = MySql2Database<typeof mainSchema>;

@Injectable()
export class PersistenceService {
  protected mainDB: MainSchema;

  constructor(@Inject(DATABASE_CONNECTION_MAIN) _main: MainSchema) {
    this.mainDB = _main;
  }
}
