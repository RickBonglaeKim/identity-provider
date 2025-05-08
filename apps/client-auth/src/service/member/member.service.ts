import { HashService } from '@app/crypto/hash/hash.service';
import { ExceptionService } from '@app/exception/exception.service';
import { MemberDetailRepository } from '@app/persistence/schema/main/repository/member.detail.repository';
import { MemberPhoneRepository } from '@app/persistence/schema/main/repository/member.phone.repository';
import { MemberRepository } from '@app/persistence/schema/main/repository/member.repository';
import { Injectable, Logger } from '@nestjs/common';
import { SignupService } from '../sign.up/sign.up.service';
import { Transactional } from '@nestjs-cls/transactional';
import { member } from 'libs/persistence/database-schema/main/schema';
import { MemberCreateRequest } from 'dto/interface/member/create/member.create.request.dto';

@Injectable()
export class MemberService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly exceptionService: ExceptionService,
  ) {}

  @Transactional()
  async createMember(data: MemberCreateRequest): Promise<number> {
    const memberResult = await this.memberRepository.insertMember({
      isConsentedTermsAndConditions: data.isConsentedTermsAndConditions ? 1 : 0,
      isConsentedCollectionAndUsePersonalData:
        data.isConsentedCollectionAndUsePersonalData ? 1 : 0,
      isConsentedMarketingUseAndInformationReceiving:
        data.isConsentedMarketingUseAndInformationReceiving ? 1 : 0,
    });

    if (!memberResult) this.exceptionService.notRecognizedError();
    if (!memberResult?.isSucceed || !memberResult?.data)
      this.exceptionService.notInsertedEntity('member');

    return memberResult!.data!;
  }
}
