import { mainConnection } from '@app/persistence/persistence.connection.main';
import { Module } from '@nestjs/common';
import { ClientKeypairRepository } from './repository/client.keypair.repository';
import { MemberRepository } from './repository/member.repository';
import { MemberDetailRepository } from './repository/member.detail.repository';
import { MemberPhoneRepository } from './repository/member.phone.repository';
import { OauthRepository } from './repository/oauth.repository';
import { SignRepository } from './repository/sign.repository';
import { IdTokenKeypairRepository } from './repository/id.token.keypair.repository';
import { ClientMemberRepository } from './repository/client.member.repository';
import { ClientRepository } from './repository/client.repository';

@Module({
  providers: [
    mainConnection,
    ClientRepository,
    ClientKeypairRepository,
    MemberRepository,
    MemberDetailRepository,
    MemberPhoneRepository,
    OauthRepository,
    SignRepository,
    IdTokenKeypairRepository,
    ClientMemberRepository,
  ],
  exports: [
    mainConnection,
    ClientRepository,
    ClientKeypairRepository,
    MemberRepository,
    MemberDetailRepository,
    MemberPhoneRepository,
    OauthRepository,
    SignRepository,
    IdTokenKeypairRepository,
    ClientMemberRepository,
  ],
})
export class MainSchemaModule {}
