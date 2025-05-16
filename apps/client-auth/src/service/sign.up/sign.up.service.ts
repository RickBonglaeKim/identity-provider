import { MemberDetailRepository } from '@app/persistence/schema/main/repository/member.detail.repository';
import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { SignupRequestCreate } from 'dto/interface/sign.up/request/sign.up.request.create.dto';
import { SignupWithPhoneRequestCreate } from 'dto/interface/sign.up/request/phone/sign.up.phone.request.create.dto';
import { MemberService } from '../member/member.service';
import { SignMember } from '../../type/service/sign.service.type';
import { ExceptionService } from '@app/exception/service/exception.service';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly memberDetailRepository: MemberDetailRepository,
    private readonly memberService: MemberService,
    private readonly exceptionService: ExceptionService,
  ) {}

  @Transactional()
  async createSignup(data: SignupRequestCreate): Promise<SignMember> {
    const memberDetailData =
      await this.memberDetailRepository.selectMemberDetailByEmailAndMemberDetailIdIsNull(
        data.memberDetail.email,
      );
    this.logger.debug(
      `createSignup.memberDetailData -> ${JSON.stringify(memberDetailData)}`,
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
  async createSignupWithPhone(
    data: SignupWithPhoneRequestCreate,
  ): Promise<void> {
    this.logger.debug(`createSignupWithPhone.data -> ${JSON.stringify(data)}`);
    const signMember = await this.createSignup(data);
    if (!signMember) this.exceptionService.notInsertedEntity('sign up');
    this.logger.debug(JSON.stringify(signMember));
    data.memberPhone.memberDetailId = signMember!.memberDetailId;
    await this.memberService.createMemberPhone(
      signMember!.memberId,
      data.memberPhone,
    );
  }
}
