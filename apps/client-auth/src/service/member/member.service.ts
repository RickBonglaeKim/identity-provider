import { ExceptionService } from '@app/exception/service/exception.service';
import { MemberRepository } from '@app/persistence/schema/main/repository/member.repository';
import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { MemberRequestCreate } from 'dto/interface/member/request/member.request.create.dto';
import { HashService } from '@app/crypto/service/hash/hash.service';
import { MemberDetailRepository } from '@app/persistence/schema/main/repository/member.detail.repository';
import { MemberDetailRequestCreate } from 'dto/interface/member.detail/request/member.detail.request.create.dto';
import { MemberPhoneRepository } from '@app/persistence/schema/main/repository/member.phone.repository';
import { MemberPhoneRequestCreate } from 'dto/interface/member.phone/request/member.phone.request.create.dto';
import { ClientMemberRepository } from '@app/persistence/schema/main/repository/client.member.repository';
import { MemberDetailResponseRead } from 'dto/interface/member.detail/response/member.detail.response.read.dto';
import { MemberPhoneResponseRead } from 'dto/interface/member.phone/response/member.phone.response.read.dto';

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
  async createMember(data: MemberRequestCreate): Promise<number> {
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

    return memberResult!.data!;
  }

  @Transactional()
  async createMemberDetail(
    memberDetailId: number | null,
    memberId: number,
    data: MemberDetailRequestCreate,
  ): Promise<number> {
    this.logger.debug(`createMemberDetail.data.password -> ${data.password}`);
    const hashPassword = await this.hashService.generateHash(data.password);
    this.logger.debug(`createMemberDetail.hashPassword -> ${hashPassword}`);
    this.logger.debug(
      `createMemberDetail -> compared result is ${await this.hashService.compareHash(data.password, hashPassword)}`,
    );

    const memberDetailResult =
      await this.memberDetailRepository.insertMemberDetail({
        providerId: data.providerId,
        memberDetailId: memberDetailId,
        memberId: memberId,
        name: data.name,
        email: data.email,
        password: hashPassword,
        codeDuplicationType: data.duplicationType,
      });
    if (!memberDetailResult) this.exceptionService.notRecognizedError();
    if (!memberDetailResult?.isSucceed || !memberDetailResult.data)
      this.exceptionService.notInsertedEntity('member detail');

    return memberDetailResult!.data!;
  }

  @Transactional()
  async createMemberPhone(
    memberId: number,
    data: MemberPhoneRequestCreate,
  ): Promise<number> {
    this.logger.debug(`createMemberPhone.memberId -> ${memberId}`);
    this.logger.debug(`createMemberPhone.data -> ${JSON.stringify(data)}`);

    const memberPhoneResult =
      await this.memberPhoneRepository.insertMemberPhone({
        memberId: memberId,
        memberPhoneId: data.memberPhoneId,
        countryCallingCode: data.countryCallingCode,
        phoneNumber: data.phoneNumber,
      });
    if (!memberPhoneResult) this.exceptionService.notRecognizedError();
    if (!memberPhoneResult?.isSucceed || !memberPhoneResult.data)
      this.exceptionService.notInsertedEntity('member phone');

    return memberPhoneResult!.data!;
  }

  async createClientMember(
    clientId: number,
    memberId: number,
  ): Promise<number> {
    const clientMemberResult =
      await this.clientMemberRepository.selectClientMemberByMemberIdAndClientId(
        memberId,
        clientId,
      );
    if (!clientMemberResult) this.exceptionService.notRecognizedError();
    //-----------------------------------------------------------------------------//
    // Must return existing id of client_member table, if the data exist.
    //-----------------------------------------------------------------------------//
    if (clientMemberResult?.isSucceed && clientMemberResult.data)
      return clientMemberResult.data.id;
    //-----------------------------------------------------------------------------//
    const result = await this.clientMemberRepository.insertClientMember({
      clientId,
      memberId,
    });
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data)
      this.exceptionService.notInsertedEntity('client member');

    return result?.data as number;
  }

  async findMemberDetailById(id: number): Promise<MemberDetailResponseRead> {
    const result = await this.memberDetailRepository.selectMemberDetailById(id);
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data)
      this.exceptionService.notSelectedEntity('member detail');

    const data = result!.data!;
    return new MemberDetailResponseRead(
      data.id,
      data.memberDetailId,
      data.providerId,
      data.memberId,
      data.name,
      data.email,
      data.password,
      data.codeDuplicationType,
    );
  }

  async findMemberPhoneById(id: number): Promise<MemberPhoneResponseRead> {
    const result = await this.memberPhoneRepository.selectMemberPhoneById(id);
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || result.data)
      this.exceptionService.notSelectedEntity('member phone');

    const data = result!.data!;
    return new MemberPhoneResponseRead(
      data.id,
      data.memberPhoneId,
      data.memberId,
      data.countryCallingCode,
      data.phoneNumber,
    );
  }

  async findMemberPhoneByMemberId(
    memberId: number,
  ): Promise<MemberPhoneResponseRead[]> {
    const result =
      await this.memberPhoneRepository.selectMemberPhoneByMemberId(memberId);

    const phoneNumbers: MemberPhoneResponseRead[] = [];

    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data) return phoneNumbers;

    for (const phoneNumber of result.data) {
      phoneNumbers.push(
        new MemberPhoneResponseRead(
          phoneNumber.id,
          phoneNumber.memberPhoneId,
          phoneNumber.memberId,
          phoneNumber.countryCallingCode,
          phoneNumber.phoneNumber,
        ),
      );
    }
    return phoneNumbers;
  }

  async findEntireMemberByMemberIdAndMemberDetailId() {}
}
