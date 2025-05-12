import { Module } from '@nestjs/common';
import { HashService } from './service/hash/hash.service';
import { KeypairService } from './service/keypair/keypair.service';

@Module({
  providers: [HashService, KeypairService],
  exports: [HashService, KeypairService],
})
export class CryptoModule {}
