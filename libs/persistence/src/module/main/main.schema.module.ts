import { mainConnection } from '@app/persistence/persistence.connection.main';
import { Module } from '@nestjs/common';
import { ClientKeypairRepository } from './repository/client.keypair.repository';
import { MemberRepository } from './repository/member.repository';

@Module({
  providers: [mainConnection, ClientKeypairRepository, MemberRepository],
  exports: [mainConnection, ClientKeypairRepository, MemberRepository],
})
export class MainSchemaModule {}
