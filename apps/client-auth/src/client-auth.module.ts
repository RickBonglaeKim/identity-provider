import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
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
import { OauthController } from './controller/oauth/oauth.controller';
import { OauthService } from './service/oauth/oauth.service';
import { CacheModule } from '@app/cache/cache.module';
import { SignInController } from './controller/sign.in/sign.in.controller';
import { SigninService } from './service/sign.in/sign.in.service';
import { KeyController } from './controller/key/key.controller';
import { KeyService } from './service/key/key.service';
import { ClientService } from './service/client/client.service';
import { ChildService } from './service/child/child.service';
import { ProviderController } from './controller/provider/provider.controller';
import { ProviderService } from './service/provider/provider.service';
import { VerificationController } from './controller/verification/verification.controller';
import { VerificationService } from './service/verification/verification.service';
import { MemberController } from './controller/member/member.controller';
import { TestController } from './controller/test/test.controller';
import { SignOutController } from './controller/sign.out/sign.out.controller';

@Module({
  imports: [
    HttpModule,
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
  controllers: [
    HomeController,
    SignupController,
    SignInController,
    SignOutController,
    OauthController,
    KeyController,
    ProviderController,
    VerificationController,
    MemberController,
    TestController,
  ],
  providers: [
    MemberService,
    SignupService,
    SigninService,
    OauthService,
    KeyService,
    ClientService,
    ChildService,
    ProviderService,
    VerificationService,
  ],
})
export class ClientAuthModule {}
