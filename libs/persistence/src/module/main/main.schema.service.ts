import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as mainSchema from '../../../database-schema/main/schema';
import { DATABASE_CONNECTION_MAIN } from '@app/persistence/persistence.connection.main';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { TransactionHost } from '@nestjs-cls/transactional';

type MainSchema = MySql2Database<typeof mainSchema>;
type DrizzleAdapter = TransactionalAdapterDrizzleOrm<MainSchema>;
@Injectable()
export class MainSchemaService {
  protected mainDB: MainSchema;
  protected mainTransaction: TransactionHost<DrizzleAdapter>;
  constructor(
    @Inject(DATABASE_CONNECTION_MAIN) _main: MainSchema,
    _transactionHost: TransactionHost<DrizzleAdapter>,
  ) {
    this.mainDB = _main;
    this.mainTransaction = _transactionHost;
  }
}
