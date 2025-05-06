import { mainConnection } from '@app/persistence/persistence.connection.main';
import { Module } from '@nestjs/common';
import { ClientKeypairRepository } from './repository/client.keypair.repository';
import { MemberRepository } from './repository/member.repository';
import { MemberDetailRepository } from './repository/member.detail.repository';
import { MemberPhoneRepository } from './repository/member.phone.repository';

@Module({
  providers: [
    mainConnection,
    ClientKeypairRepository,
    MemberRepository,
    MemberDetailRepository,
    MemberPhoneRepository,
  ],
  exports: [
    mainConnection,
    ClientKeypairRepository,
    MemberRepository,
    MemberDetailRepository,
    MemberPhoneRepository,
  ],
})
export class MainSchemaModule {}
