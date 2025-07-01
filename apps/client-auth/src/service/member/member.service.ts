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
import { MemberEntireResponseRead } from 'dto/interface/member.entire/response/member.entire.response.read.dto';
import { MemberDetailPhoneRepository } from '@app/persistence/schema/main/repository/member.detail.phone.repository';
import { MemberEntireRepository } from '@app/persistence/schema/main/repository/member.entire.repository';
import { DUPLICATION_TYPE } from 'dto/enum/duplication.type.enum';
import { WithdrawalScheduleRepository } from '@app/persistence/schema/main/repository/withdrawal.schedule.repository';
import { MemberWithdrawalRequestCreate } from 'dto/interface/member.withdrawal/request/member.withdrawal.request.create.dto';

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
    private readonly memberEntireRepository: MemberEntireRepository,
    private readonly memberDetailPhoneRepository: MemberDetailPhoneRepository,
    private readonly withdrawalScheduleRepository: WithdrawalScheduleRepository,
  ) {}

  @Transactional()
  async createMember(data: MemberRequestCreate): Promise<number> {
    const memberResult = await this.memberRepository.insertMember({
      isConsentedArtBonbonTermsAndConditions:
        data.isConsentedArtBonbonTermsAndConditions ? 1 : 0,
      isConsentedILandTermsAndConditions:
        data.isConsentedILandTermsAndConditions ? 1 : 0,
      isConsentedGalleryBonbonTermsAndConditions:
        data.isConsentedGalleryBonbonTermsAndConditions ? 1 : 0,
      isConsentedCollectionAndUsePersonalData:
        data.isConsentedCollectionAndUsePersonalData ? 1 : 0,
      isConsentedUseAiSketchService: data.isConsentedUseAiSketchService ? 1 : 0,
      isConsentedOver14Years: data.isConsentedOver14Years ? 1 : 0,
      isConsentedEventAndInformationReceiving:
        data.isConsentedEventAndInformationReceiving ? 1 : 0,
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
    const hashPassword = await this.hashService.generateHash(data.password!);
    this.logger.debug(`createMemberDetail.hashPassword -> ${hashPassword}`);
    this.logger.debug(
      `createMemberDetail -> compared result is ${await this.hashService.compareHash(data.password!, hashPassword)}`,
    );

    const memberDetailResult =
      await this.memberDetailRepository.insertMemberDetail({
        providerId: data.providerId,
        memberDetailId: memberDetailId,
        memberId: memberId,
        memberProviderKey: data.memberProviderKey!,
        name: data.name,
        email: data.email,
        password: hashPassword,
        codeDuplicationType: data.duplicationType || DUPLICATION_TYPE.NONE,
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

  @Transactional()
  async changePasswordOfMemberDetailById(
    memberDetailId: number,
    password: string,
  ): Promise<number> {
    const hashPassword = await this.hashService.generateHash(password);
    const result =
      await this.memberDetailRepository.updatePasswordOfMemberDetailById(
        memberDetailId,
        hashPassword,
      );
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data)
      this.exceptionService.notUpdatedEntity('member detail');

    return result!.data!;
  }

  @Transactional()
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
    this.logger.debug(
      `createClientMember.clientMemberResult -> ${JSON.stringify(
        clientMemberResult,
      )}`,
    );
    //-----------------------------------------------------------------------------//
    // Must return existing id of client_member table, if the data exist.
    //-----------------------------------------------------------------------------//
    if (clientMemberResult?.isSucceed && clientMemberResult.data) {
      return clientMemberResult.data.id;
    }
    //-----------------------------------------------------------------------------//
    const result = await this.clientMemberRepository.insertClientMember({
      clientId,
      memberId,
    });
    this.logger.debug(`createClientMember.result -> ${JSON.stringify(result)}`);
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

  async findEntireMemberByMemberDetailId(
    memberDetailId: number,
  ): Promise<MemberEntireResponseRead> {
    const memberEntireResult =
      await this.memberEntireRepository.selectMemberAndMemberDetailAndProviderByMemberDetailId(
        memberDetailId,
      );
    if (!memberEntireResult) this.exceptionService.notRecognizedError();
    if (!memberEntireResult?.isSucceed || !memberEntireResult.data) {
      this.exceptionService.notSelectedEntity('member group tables');
    }

    const member = memberEntireResult!.data!;

    const memberDetailPhoneResult =
      await this.memberDetailPhoneRepository.selectMemberDetailPhoneByMemberDetailId(
        memberDetailId,
      );
    if (!memberDetailPhoneResult) this.exceptionService.notRecognizedError();
    if (
      memberDetailPhoneResult?.isSucceed &&
      memberDetailPhoneResult.data!.length > 1
    ) {
      this.exceptionService.tooManyEntity('member_detail_phone');
    }

    // If the member does not have a phone number, return only member information.
    if (!memberDetailPhoneResult?.isSucceed) {
      return new MemberEntireResponseRead(
        member.createdAt,
        member.isConsentedArtBonbonTermsAndConditions === 1,
        member.isConsentedILandTermsAndConditions === 1,
        member.isConsentedGalleryBonbonTermsAndConditions === 1,
        member.isConsentedCollectionAndUsePersonalData === 1,
        member.isConsentedUseAiSketchService === 1,
        member.isConsentedOver14Years === 1,
        member.isConsentedEventAndInformationReceiving === 1,
        member.name,
        member.email,
        null,
      );
    }

    const memberPhoneResult =
      await this.memberPhoneRepository.selectMemberPhoneById(
        memberDetailPhoneResult.data![0].memberPhoneId,
      );
    if (!memberPhoneResult) this.exceptionService.notRecognizedError();
    if (!memberPhoneResult?.isSucceed || !memberPhoneResult.data)
      this.exceptionService.notSelectedEntity('member_phone');

    const memberPhone = memberPhoneResult!.data;

    let phone: { countryCallingCode: string; phoneNumber: string } | null =
      null;
    if (memberPhone) {
      phone = {
        countryCallingCode: memberPhone.countryCallingCode,
        phoneNumber: memberPhone.phoneNumber,
      };
    }

    return new MemberEntireResponseRead(
      member.createdAt,
      member.isConsentedArtBonbonTermsAndConditions === 1,
      member.isConsentedILandTermsAndConditions === 1,
      member.isConsentedGalleryBonbonTermsAndConditions === 1,
      member.isConsentedCollectionAndUsePersonalData === 1,
      member.isConsentedUseAiSketchService === 1,
      member.isConsentedOver14Years === 1,
      member.isConsentedEventAndInformationReceiving === 1,
      member.name,
      member.email,
      phone,
    );
  }

  @Transactional()
  async createWithdrawalSchedule(
    memberId: number,
    data: MemberWithdrawalRequestCreate,
  ): Promise<number> {
    this.logger.debug(`createWithdrawalSchedule.memberId -> ${memberId}`);
    this.logger.debug(
      `createWithdrawalSchedule.data -> ${JSON.stringify(data)}`,
    );
    const bookingDatetime = new Date();
    bookingDatetime.setDate(bookingDatetime.getDate() + 7);
    const bookedAt = bookingDatetime
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '');
    this.logger.debug(
      `createWithdrawalSchedule.bookingDatetime -> ${bookedAt}`,
    );
    const withdrawalScheduleResult =
      await this.withdrawalScheduleRepository.insertWithdrawalSchedule({
        memberId,
        bookedAt,
        codeReason: data.withdrawalReason,
        reasonExplanation: data.reasonExplanation,
      });
    if (!withdrawalScheduleResult) this.exceptionService.notRecognizedError();
    if (!withdrawalScheduleResult?.isSucceed || !withdrawalScheduleResult.data)
      this.exceptionService.notInsertedEntity('withdrawal_schedule');

    return withdrawalScheduleResult!.data!;
  }
}
