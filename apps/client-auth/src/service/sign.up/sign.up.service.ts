import { MemberDetailRepository } from '@app/persistence/schema/main/repository/member.detail.repository';
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
    private readonly memberService: MemberService,
  ) {}

  @Transactional()
  async createSignup(data: SignupCreateRequest): Promise<number> {
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
    await this.memberService.createMemberDetail(
      memberDetailId,
      memberId,
      data.memberDetail,
    );

    return memberId;
  }

  @Transactional()
  async createSignupWithPhone(
    data: SignupWithPhoneCreateRequest,
  ): Promise<void> {
    this.logger.debug(`createSignupWithPhone.data -> ${JSON.stringify(data)}`);
    const memberId: number = await this.createSignup(data);
    this.logger.debug(memberId);
    await this.memberService.createMemberPhone(memberId, data.memberPhone);
  }
}
