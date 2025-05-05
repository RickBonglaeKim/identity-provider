import { Module } from '@nestjs/common';
import { MainSchemaModule } from '@app/persistence/module/main/main.schema.module';
import { mainConnection } from '@app/persistence/persistence.connection.main';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { ConfigModule } from '@nestjs/config';
import { ExceptionModule } from '@app/exception/exception.module';
import { HomeController } from './controller/home/home.controller';

@Module({
  imports: [
    MainSchemaModule,
    ExceptionModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `./env/.env.${process.env.NODE_ENV}`,
    }),
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [MainSchemaModule],
          adapter: new TransactionalAdapterDrizzleOrm({
            drizzleInstanceToken: mainConnection.provide,
          }),
        }),
      ],
    }),
  ],
  controllers: [HomeController],
  providers: [],
})
export class ClientAuthModule {}
