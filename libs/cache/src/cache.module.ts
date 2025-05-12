import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GlideClusterClient, GlideClient } from '@valkey/valkey-glide';
import { VALKEY_CONNECTION } from './cache-connection-symbol';
import { CheckCacheRepository } from './repository/check.cache.repository';
import { PassportCacheRepository } from './repository/passport.cache.repository';
import { AuthorizationCodeCacheRepository } from './repository/authorization.code.cache.repository';
import { AuthorizationAccessTokenCacheRepository } from './repository/authorization.token.access.repository';
import { AuthorizationRefreshTokenCacheRepository } from './repository/authorization.token.refresh.repository';

const cache = {
  provide: VALKEY_CONNECTION,
  async useFactory(configService: ConfigService) {
    const environment = configService.getOrThrow<string>('NODE_ENV');
    if (environment === 'development' || environment === 'production') {
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
    AuthorizationAccessTokenCacheRepository,
    AuthorizationRefreshTokenCacheRepository,
  ],
  exports: [
    CheckCacheRepository,
    PassportCacheRepository,
    AuthorizationCodeCacheRepository,
    AuthorizationAccessTokenCacheRepository,
    AuthorizationRefreshTokenCacheRepository,
  ],
})
export class CacheModule {}
