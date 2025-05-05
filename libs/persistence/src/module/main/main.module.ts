import { mainConnection } from '@app/persistence/persistence.connection.main';
import { Module } from '@nestjs/common';
import { ClientKeypairRepository } from './repository/client.keypair.repository';

@Module({
  providers: [mainConnection, ClientKeypairRepository],
  exports: [ClientKeypairRepository],
})
export class MainModule {}
