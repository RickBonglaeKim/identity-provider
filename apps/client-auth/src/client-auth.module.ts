import { Module } from '@nestjs/common';
import { ClientAuthController } from './client-auth.controller';
import { ClientAuthService } from './client-auth.service';
import { MainSchemaModule } from '@app/persistence/module/main/main.schema.module';
import { DATABASE_CONNECTION_MAIN } from '@app/persistence/persistence.connection.main';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';

@Module({
  imports: [
    MainSchemaModule,
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [MainSchemaModule],
          adapter: new TransactionalAdapterDrizzleOrm({
            drizzleInstanceToken: DATABASE_CONNECTION_MAIN,
          }),
        }),
      ],
    }),
  ],
  controllers: [ClientAuthController],
  providers: [ClientAuthService],
})
export class ClientAuthModule {}
