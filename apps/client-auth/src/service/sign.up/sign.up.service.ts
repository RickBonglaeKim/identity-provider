import { MemberDetailRepository } from '@app/persistence/schema/main/repository/member.detail.repository';
import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { SignUpRequestCreate } from 'dto/interface/sign.up/request/sign.up.request.create.dto';
import { SignUpWithPhoneRequestCreate } from 'dto/interface/sign.up/request/phone/sign.up.phone.request.create.dto';
import { MemberService } from '../member/member.service';
import {
  SignMember,
  SignMemberPhone,
} from '../../type/service/sign.service.type';
import { ExceptionService } from '@app/exception/service/exception.service';
import { MemberDetailPhoneRepository } from '@app/persistence/schema/main/repository/member.detail.phone.repository';
import { MemberPhoneRepository } from '@app/persistence/schema/main/repository/member.phone.repository';
import { PROVIDER } from 'dto/enum/provider.enum';
import cryptoRandomString from 'crypto-random-string';
import trimPhoneNumber from '../../util/trim.phoneNumber';

@Injectable()
export class SignUpService {
  private readonly logger = new Logger(SignUpService.name);

  constructor(
    private readonly memberDetailRepository: MemberDetailRepository,
    private readonly memberDetailPhoneRepository: MemberDetailPhoneRepository,
    private readonly memberPhoneRepository: MemberPhoneRepository,
    private readonly memberService: MemberService,
    private readonly exceptionService: ExceptionService,
  ) {}

  @Transactional()
  async createSignUp(data: SignUpRequestCreate): Promise<SignMember> {
    const memberDetailData =
      await this.memberDetailRepository.selectMemberDetailByEmailAndMemberDetailIdIsNull(
        data.memberDetail.email,
      );
    this.logger.debug(
      `createSignUp.memberDetailData -> ${JSON.stringify(memberDetailData)}`,
    );

    let memberId: number;
    let memberDetailId: number | null;

    if (memberDetailData?.isSucceed) {
      // TODO: Check the email is verified or not by the cache.
      memberId = memberDetailData.data!.memberId;
      memberDetailId = memberDetailData.data!.id;
    } else {
      memberId = await this.memberService.createMember(data.member);
      memberDetailId = null;
    }
    const createdMemberDetailId = await this.memberService.createMemberDetail(
      memberDetailId,
      memberId,
      data.memberDetail,
    );

    return { memberId: memberId, memberDetailId: createdMemberDetailId };
  }

  @Transactional()
  async createSignUpWithoutDuplication(
    data: SignUpRequestCreate,
  ): Promise<SignMember | undefined> {
    this.logger.debug(
      `createSignUpWithoutDuplication.data -> ${JSON.stringify(data)}`,
    );
    const memberDetailData =
      await this.memberDetailRepository.selectMemberDetailByEmail(
        data.memberDetail.email,
      );
    this.logger.debug(
      `createSignUpWithoutDuplication.memberDetailData -> ${JSON.stringify(memberDetailData)}`,
    );
    if (memberDetailData?.isSucceed) return;

    if (data.memberDetail.providerId === PROVIDER.I_SCREAM_ART) {
      const key = cryptoRandomString({ length: 64, type: 'hex' });
      data.memberDetail.memberProviderKey = `${data.memberDetail.providerId}.${key}`;
    }

    const memberId = await this.memberService.createMember(data.member);
    const memberDetailId = await this.memberService.createMemberDetail(
      null,
      memberId,
      data.memberDetail,
    );

    return { memberId: memberId, memberDetailId: memberDetailId };
  }

  @Transactional()
  async createSignUpWithPhone(
    data: SignUpWithPhoneRequestCreate,
  ): Promise<SignMemberPhone | undefined> {
    // Trim the phone number (e.g. 01055559871 -> 1055559871)
    data.memberPhone.phoneNumber = trimPhoneNumber(
      data.memberPhone.phoneNumber,
    );
    this.logger.debug(`createSignUpWithPhone.data -> ${JSON.stringify(data)}`);

    const memberPhoneData =
      await this.memberPhoneRepository.selectMemberPhoneByCountryCallingCodeAndPhoneNumber(
        data.memberPhone.countryCallingCode,
        data.memberPhone.phoneNumber,
      );
    this.logger.debug(
      `createSignUpWithPhone.memberPhoneData -> ${JSON.stringify(memberPhoneData)}`,
    );
    if (memberPhoneData?.isSucceed) return;

    const signMember = await this.createSignUpWithoutDuplication(data);
    if (!signMember) return;

    const memberPhoneId = await this.memberService.createMemberPhone(
      signMember.memberId,
      data.memberPhone,
    );

    const memberDetailPhoneResult =
      await this.memberDetailPhoneRepository.insertMemberDetailPhone({
        memberDetailId: signMember.memberDetailId,
        memberPhoneId: memberPhoneId,
      });
    if (!memberDetailPhoneResult?.isSucceed) {
      this.exceptionService.notInsertedEntity('member_detail_phone');
    }

    return {
      memberId: signMember.memberId,
      memberDetailId: signMember.memberDetailId,
      memberPhoneId: memberPhoneId,
    };
  }
}
