import { HashService } from '@app/crypto/hash/hash.service';
import { ExceptionService } from '@app/exception/exception.service';
import { MemberDetailRepository } from '@app/persistence/schema/main/repository/member.detail.repository';
import { MemberPhoneRepository } from '@app/persistence/schema/main/repository/member.phone.repository';
import { MemberRepository } from '@app/persistence/schema/main/repository/member.repository';
import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { SignupCreateRequest } from 'dto/interface/sign.up/create/sign.up.create.request.dto';
import { SignupWithPhoneCreateRequest } from 'dto/interface/sign.up/create/sign.up.phone.create.request.dto';
import { MemberService } from '../member/member.service';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly memberDetailRepository: MemberDetailRepository,
    private readonly memberPhoneRepository: MemberPhoneRepository,
    private readonly memberService: MemberService,
    private readonly exceptionService: ExceptionService,
    private readonly hashService: HashService,
  ) {}

  @Transactional()
  async createSignup(data: SignupCreateRequest): Promise<number> {
    let memberDetailData =
      await this.memberDetailRepository.selectMemberDetailByEmailAndMemberDetailIdIsNull(
        data.memberDetail.email,
      );
    this.logger.debug(
      `memberDetailData -> ${JSON.stringify(memberDetailData)}`,
    );

    let memberId: number;

    if (memberDetailData?.isSucceed) {
      // TODO: Check the email is verified or not by the cache.

      memberId = memberDetailData?.data!.memberId;
      memberDetailData =
        await this.memberDetailRepository.selectMemberDetailById(
          memberDetailData?.data!.id,
        );
      if (!memberDetailData) this.exceptionService.notRecognizedError();
      if (!memberDetailData?.isSucceed || !memberDetailData?.data)
        this.exceptionService.notSelectedEntity('member detail');
    } else {
      memberId = await this.memberService.createMember(data.member);
      this.logger.debug(`memberResult.memberId -> ${memberId}`);
    }

    const hashPassword = await this.hashService.generateHash(
      data.memberDetail.password,
    );
    this.logger.debug(`hashPassword -> ${hashPassword}`);

    const memberDetailResult =
      await this.memberDetailRepository.insertMemberDetail({
        memberDetailId: memberDetailData?.data?.id,
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
  ): Promise<void> {
    const memberId = await this.createSignup(data);
    const memberPhoneData =
      await this.memberPhoneRepository.selectMemberDetailByMemberIdAndPhoneNumber(
        memberId,
        data.memberPhone.phoneNumber,
      );
    if (!memberPhoneData?.isSucceed || !memberPhoneData.data) return;
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

    return;
  }
}
