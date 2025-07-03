import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { MemberService } from '../../service/member/member.service';
import { SignCookie } from '../../type/service/sign.service.type';
import { MemberEntireResponseRead } from 'dto/interface/member.entire/response/member.entire.response.read.dto';
import { SignInfo } from '../../decorator/sign.decorator';
import { SignGuard } from '../../guard/sign.guard';
import { MemberDetailPasswordRequestUpdate } from 'dto/interface/member.detail/request/member.detail.password.request.update.dto';
import { MemberWithdrawalRequestCreate } from 'dto/interface/member.withdrawal/request/member.withdrawal.request.create.dto';
import { SignOutService } from '../../service/sign.out/sign.out.service';

@Controller('member')
@UseInterceptors(TransformInterceptor)
export class MemberController {
  private readonly logger = new Logger(MemberController.name);
  constructor(
    private readonly memberService: MemberService,
    private readonly signOutService: SignOutService,
  ) {}

  @Get('sign')
  @UseGuards(SignGuard)
  getTest(@SignInfo() signCookie: SignCookie): void {
    this.logger.debug(`getTest.signCookie -> ${JSON.stringify(signCookie)}`);
    return;
  }

  @Patch('password')
  @UseGuards(SignGuard)
  async changePasswordOfMemberDetailById(
    @SignInfo() signCookie: SignCookie,
    @Body() data: MemberDetailPasswordRequestUpdate,
  ): Promise<void> {
    await this.memberService.changePasswordOfMemberDetailById(
      signCookie.memberDetailId,
      data.password,
    );
    return;
  }

  @Get('entire')
  @UseGuards(SignGuard)
  async getEntireMember(
    @SignInfo() signCookie: SignCookie,
  ): Promise<MemberEntireResponseRead> {
    return this.memberService.findEntireMemberByMemberDetailId(
      signCookie.memberDetailId,
    );
  }

  @Post('withdrawal')
  @UseGuards(SignGuard)
  async postWithdrawalMember(
    @SignInfo() signCookie: SignCookie,
    @Res({ passthrough: true }) response: Response,
    @Body() data: MemberWithdrawalRequestCreate,
  ): Promise<void> {
    await this.memberService.createWithdrawalSchedule(
      signCookie.memberId,
      data,
    );
    this.signOutService.signOut(response);
    return;
  }
}
