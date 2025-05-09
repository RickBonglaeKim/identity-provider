import { Module } from '@nestjs/common';
import { MainSchemaModule } from '@app/persistence/schema/main/main.schema.module';
import { mainConnection } from '@app/persistence/persistence.connection.main';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { ConfigModule } from '@nestjs/config';
import { ExceptionModule } from '@app/exception/exception.module';
import { HomeController } from './controller/home/home.controller';
import { SignupController } from './controller/sign.up/sign.up.controller';
import { SignupService } from './service/sign.up/sign.up.service';
import { CryptoModule } from '@app/crypto/crypto.module';
import { MemberService } from './service/member/member.service';
import { MemberDetailService } from './service/member.detail/member.detail.service';
import { MemberPhoneService } from './service/member.phone/member.phone.service';
import { OauthController } from './controller/oauth/oauth.controller';
import { OauthService } from './service/oauth/oauth.service';
import { CacheModule } from '@app/cache/cache.module';

@Module({
  imports: [
    MainSchemaModule,
    ExceptionModule,
    CryptoModule,
    CacheModule,
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
  controllers: [HomeController, SignupController, OauthController],
  providers: [
    MemberService,
    MemberDetailService,
    MemberPhoneService,
    SignupService,
    OauthService,
  ],
})
export class ClientAuthModule {}
