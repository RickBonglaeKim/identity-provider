import { ExceptionService } from '@app/exception/exception.service';
import { MemberDetailRepository } from '@app/persistence/schema/main/repository/member.detail.repository';
import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { SignupCreateRequest } from 'dto/interface/sign.up/create/sign.up.create.request.dto';
import { SignupWithPhoneCreateRequest } from 'dto/interface/sign.up/create/sign.up.phone.create.request.dto';
import { MemberService } from '../member/member.service';
import { MemberDetailService } from '../member.detail/member.detail.service';
import { MemberPhoneService } from '../member.phone/member.phone.service';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly memberDetailRepository: MemberDetailRepository,
    private readonly memberService: MemberService,
    private readonly memberDetailService: MemberDetailService,
    private readonly memberPhoneService: MemberPhoneService,
    private readonly exceptionService: ExceptionService,
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
      memberId = memberDetailData?.data?.memberId as number;
      memberDetailData =
        await this.memberDetailRepository.selectMemberDetailById(
          memberDetailData?.data?.id as number,
        );
      if (!memberDetailData) this.exceptionService.notRecognizedError();
      if (!memberDetailData?.isSucceed || !memberDetailData?.data)
        this.exceptionService.notSelectedEntity('member detail');
    } else {
      memberId = await this.memberService.createMember(data.member);
      this.logger.debug(`memberResult.memberId -> ${memberId}`);
    }
    await this.memberDetailService.createMemberDetail(
      memberDetailData?.data?.memberDetailId as number,
      memberId,
      data.memberDetail,
    );

    return memberId;
  }

  @Transactional()
  async createSignupWithPhone(
    data: SignupWithPhoneCreateRequest,
  ): Promise<void> {
    const memberId = await this.createSignup(data);
    await this.memberPhoneService.createMemberPhone(memberId, data.memberPhone);
  }
}
