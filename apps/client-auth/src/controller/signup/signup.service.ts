import { HashService } from '@app/crypto/hash/hash.service';
import { ExceptionService } from '@app/exception/exception.service';
import { MemberDetailRepository } from '@app/persistence/module/main/repository/member.detail.repository';
import { MemberPhoneRepository } from '@app/persistence/module/main/repository/member.phone.repository';
import { MemberRepository } from '@app/persistence/module/main/repository/member.repository';
import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { SignupCreateRequest } from 'dto/interface/signup/create/signup.create.request.dto';
import { SignupWithPhoneCreateRequest } from 'dto/interface/signup/create/signup.phone.create.request.dto';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly memberDetailRepository: MemberDetailRepository,
    private readonly memberPhoneRepository: MemberPhoneRepository,
    private readonly exceptionService: ExceptionService,
    private readonly hashService: HashService,
  ) {}

  @Transactional()
  async createSignup(data: SignupCreateRequest): Promise<number> {
    const memberResult = await this.memberRepository.insertMember({
      isConsentedTermsAndConditions: data.member.isConsentedTermsAndConditions
        ? 1
        : 0,
      isConsentedCollectionAndUsePersonalData: data.member
        .isConsentedCollectionAndUsePersonalData
        ? 1
        : 0,
      isConsentedMarketingUseAndInformationReceiving: data.member
        .isConsentedMarketingUseAndInformationReceiving
        ? 1
        : 0,
    });
    if (!memberResult) {
      this.exceptionService.notRecognizedError();
    }
    if (!memberResult?.isSucceed || !memberResult?.data) {
      this.exceptionService.notInsertedEntity('member');
    }
    const memberId: number = memberResult!.data!;
    this.logger.debug(memberId);

    const memberDetailId = (
      await this.memberDetailRepository.selectMemberDetailByEmailAndMemberDetailIdIsNull(
        data.memberDetail.email,
      )
    )?.data?.memberDetailId;

    const hashPassword = await this.hashService.generateHash(
      data.memberDetail.password,
    );
    this.logger.debug(hashPassword);
    const memberDetailResult =
      await this.memberDetailRepository.insertMemberDetail({
        memberDetailId: memberDetailId,
        providerKey: data.memberDetail.providerKey,
        memberId: memberId,
        name: data.memberDetail.name,
        email: data.memberDetail.email,
        password: hashPassword,
      });
    if (!memberDetailResult) {
      this.exceptionService.notRecognizedError();
    }
    if (!memberDetailResult?.isSucceed || !memberDetailResult?.data) {
      this.exceptionService.notInsertedEntity('member detail');
    }

    return memberId;
  }

  @Transactional()
  async createSignupWithPhone(
    data: SignupWithPhoneCreateRequest,
  ): Promise<number> {
    const memberId = await this.createSignup(data);
    const memberPhoneResult =
      await this.memberPhoneRepository.insertMemberDetail({
        memberId: memberId,
        isPrimary: data.memberPhone.isPrimary ? 1 : 0,
        countryCallingCode: data.memberPhone.countryCallingCode,
        phoneNumber: data.memberPhone.phoneNumber,
      });
    if (!memberPhoneResult) {
      this.exceptionService.notRecognizedError();
    }
    if (!memberPhoneResult?.isSucceed || !memberPhoneResult?.data) {
      this.exceptionService.notInsertedEntity('member detail');
    }

    return memberId;
  }
}
