import { Module } from '@nestjs/common';
import { HashService } from './hash/hash.service';
import { KeypairService } from './keypair/keypair.service';

@Module({
  providers: [HashService, KeypairService],
  exports: [HashService, KeypairService],
})
export class CryptoModule {}
