import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GlideClusterClient, GlideClient } from '@valkey/valkey-glide';
import { VALKEY_CONNECTION } from './cache-connection-symbol';

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
  providers: [cache],
  exports: [],
})
export class CacheModule {}
