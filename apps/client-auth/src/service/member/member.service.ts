import { ExceptionService } from '@app/exception/exception.service';
import { MemberRepository } from '@app/persistence/schema/main/repository/member.repository';
import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { MemberCreateRequest } from 'dto/interface/member/create/member.create.request.dto';

@Injectable()
export class MemberService {
  private readonly logger = new Logger(MemberService.name);

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

    return memberResult?.data as number;
  }
}
