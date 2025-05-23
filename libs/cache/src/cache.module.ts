import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GlideClusterClient, GlideClient } from '@valkey/valkey-glide';
import { VALKEY_CONNECTION } from './cache-connection-symbol';
import { CheckCacheRepository } from './repository/check.cache.repository';
import { PassportCacheRepository } from './repository/passport.cache.repository';
import { AuthorizationCodeCacheRepository } from './repository/authorization.code.cache.repository';
import { VerificationCacheRepository } from './repository/verification.cache.repository';
import { AuthorizationTokenCacheRepository } from './repository/authorization.token.token.cache.repository';

const cache = {
  provide: VALKEY_CONNECTION,
  async useFactory(configService: ConfigService) {
    const environment = configService.getOrThrow<string>('NODE_ENV');
    if (environment === 'dev' || environment === 'prod') {
      return await GlideClusterClient.createClient({
        addresses: [
          {
            host: configService.getOrThrow<string>('CACHE_HOST'),
            port: configService.getOrThrow<number>('CACHE_PORT'),
          },
        ],
        clientName: 'system-IDP',
      });
    }
    return await GlideClient.createClient({
      addresses: [
        {
          host: configService.getOrThrow<string>('CACHE_HOST'),
          port: configService.getOrThrow<number>('CACHE_PORT'),
        },
      ],
      clientName: 'system-IDP',
    });
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `./env/.env.${process.env.NODE_ENV}`,
    }),
  ],
  providers: [
    cache,
    CheckCacheRepository,
    PassportCacheRepository,
    AuthorizationCodeCacheRepository,
    AuthorizationTokenCacheRepository,
    VerificationCacheRepository,
  ],
  exports: [
    CheckCacheRepository,
    PassportCacheRepository,
    AuthorizationCodeCacheRepository,
    AuthorizationTokenCacheRepository,
    VerificationCacheRepository,
  ],
})
export class CacheModule {}
