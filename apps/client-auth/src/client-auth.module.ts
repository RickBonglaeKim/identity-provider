import { Module } from '@nestjs/common';
import { ClientAuthController } from './client-auth.controller';
import { ClientAuthService } from './client-auth.service';

@Module({
  imports: [],
  controllers: [ClientAuthController],
  providers: [ClientAuthService],
})
export class ClientAuthModule {}
