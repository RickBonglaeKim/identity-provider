import { ExceptionService } from '@app/exception/service/exception.service';
import { MemberRepository } from '@app/persistence/schema/main/repository/member.repository';
import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { MemberCreateRequest } from 'dto/interface/member/create/member.create.request.dto';
import { HashService } from '@app/crypto/service/hash/hash.service';
import { MemberDetailRepository } from '@app/persistence/schema/main/repository/member.detail.repository';
import { MemberDetailCreateRequest } from 'dto/interface/member.detail/create/member.detail.create.request.dto';
import { MemberPhoneRepository } from '@app/persistence/schema/main/repository/member.phone.repository';
import { MemberPhoneCreateREquest } from 'dto/interface/member.phone/create/member.phone.create.request.dto';
import { ClientMemberRepository } from '@app/persistence/schema/main/repository/client.member.repository';

@Injectable()
export class MemberService {
  private readonly logger = new Logger(MemberService.name);

  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly memberDetailRepository: MemberDetailRepository,
    private readonly memberPhoneRepository: MemberPhoneRepository,
    private readonly clientMemberRepository: ClientMemberRepository,
    private readonly exceptionService: ExceptionService,
    private readonly hashService: HashService,
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
    if (!memberResult?.isSucceed || !memberResult.data)
      this.exceptionService.notInsertedEntity('member');

    return memberResult?.data as number;
  }

  @Transactional()
  async createMemberDetail(
    memberDetailId: number | null,
    memberId: number,
    data: MemberDetailCreateRequest,
  ): Promise<number> {
    this.logger.debug(`createMemberDetail.data.password -> ${data.password}`);
    const hashPassword = await this.hashService.generateHash(data.password);
    this.logger.debug(`createMemberDetail.hashPassword -> ${hashPassword}`);
    this.logger.debug(
      `createMemberDetail -> compared result is ${await this.hashService.compareHash(data.password, hashPassword)}`,
    );

    const memberDetailResult =
      await this.memberDetailRepository.insertMemberDetail({
        memberDetailId: memberDetailId,
        providerKey: data.providerKey,
        memberId: memberId,
        name: data.name,
        email: data.email,
        password: hashPassword,
      });
    if (!memberDetailResult) this.exceptionService.notRecognizedError();
    if (!memberDetailResult?.isSucceed || !memberDetailResult.data)
      this.exceptionService.notInsertedEntity('member detail');

    return memberDetailResult?.data as number;
  }

  @Transactional()
  async createMemberPhone(
    memberId: number,
    data: MemberPhoneCreateREquest,
  ): Promise<number | null> {
    this.logger.debug(`createMemberPhone.memberId -> ${memberId}`);
    this.logger.debug(`createMemberPhone.data -> ${JSON.stringify(data)}`);
    const memberPhoneData =
      await this.memberPhoneRepository.selectMemberDetailByMemberIdAndPhoneNumber(
        memberId,
        data.phoneNumber,
      );
    this.logger.debug(
      `createMemberPhone.memberPhoneData -> ${JSON.stringify(memberPhoneData)}`,
    );
    if (memberPhoneData?.isSucceed as boolean) return null;

    const memberPhoneResult =
      await this.memberPhoneRepository.insertMemberPhone({
        memberId: memberId,
        isPrimary: data.isPrimary ? 1 : 0,
        countryCallingCode: data.countryCallingCode,
        phoneNumber: data.phoneNumber,
      });
    if (!memberPhoneResult) this.exceptionService.notRecognizedError();
    if (!memberPhoneResult?.isSucceed || !memberPhoneResult.data)
      this.exceptionService.notInsertedEntity('member phone');

    return memberPhoneResult?.data as number;
  }

  async createClientMember(
    clientId: number,
    memberId: number,
  ): Promise<number> {
    const data = { clientId, memberId };
    const result = await this.clientMemberRepository.insertMemberClient(data);
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data)
      this.exceptionService.notInsertedEntity('client member');

    return result?.data as number;
  }
}
