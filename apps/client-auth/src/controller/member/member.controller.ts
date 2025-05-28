import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChildService } from '../../service/child/child.service';
import { MemberService } from '../../service/member/member.service';
import * as cryptoJS from 'crypto-js';
import { Request } from 'express';
import { SignCookie } from '../../type/service/sign.service.type';
import { MemberEntireRepository } from '@app/persistence/schema/main/repository/member.entire.repository';
import { MemberDetailPhoneRepository } from '@app/persistence/schema/main/repository/member.detail.phone.repository';
import { ExceptionService } from '@app/exception/service/exception.service';
import { MemberPhoneRepository } from '@app/persistence/schema/main/repository/member.phone.repository';
import { MemberEntireResponseRead } from 'dto/interface/member.entire/response/member.entire.response.read.dto';
import { SignInfo } from '../../decorator/sign.decorator';
import { SignGuard } from '../../guard/sign.guard';
import { MemberDetailPasswordRequestUpdate } from 'dto/interface/member.detail/request/member.detail.password.request.update.dto';

@Controller('member')
@UseInterceptors(TransformInterceptor)
export class MemberController {
  private readonly logger = new Logger(MemberController.name);
  private readonly cookieEncryptionKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly exceptionService: ExceptionService,
    private readonly memberService: MemberService,
    private readonly childService: ChildService,
    private readonly memberEntireRepository: MemberEntireRepository,
    private readonly memberDetailPhoneRepository: MemberDetailPhoneRepository,
    private readonly memberPhoneRepository: MemberPhoneRepository,
  ) {
    this.cookieEncryptionKey = this.configService.getOrThrow<string>(
      'COOKIE_ENCRYPTION_KEY',
    );
  }

  @Get('test')
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
  async getEntireMember(
    @Req() request: Request,
  ): Promise<MemberEntireResponseRead> {
    const encryptedCookieValue = request.cookies['iScreamArts-IDP'] as string;
    this.logger.debug(
      `getEntireMember.encryptedCookieValue -> ${encryptedCookieValue}`,
    );
    const decryptedCookieValue = cryptoJS.AES.decrypt(
      encryptedCookieValue,
      this.cookieEncryptionKey,
    ).toString(cryptoJS.enc.Utf8);
    const signCookie = JSON.parse(decryptedCookieValue) as SignCookie;
    this.logger.debug(
      `getEntireMember.signCookie -> ${JSON.stringify(signCookie)}`,
    );

    const memberEntireResult =
      await this.memberEntireRepository.selectMemberAndMemberDetailAndProviderByMemberDetailId(
        signCookie.memberDetailId,
      );
    this.logger.debug(JSON.stringify(memberEntireResult));
    if (!memberEntireResult) this.exceptionService.notRecognizedError();
    if (!memberEntireResult?.isSucceed || !memberEntireResult.data)
      this.exceptionService.notSelectedEntity('member');
    const memberDetailPhoneResult =
      await this.memberDetailPhoneRepository.selectMemberDetailByMemberDetailId(
        signCookie.memberDetailId,
      );
    if (!memberDetailPhoneResult) this.exceptionService.notRecognizedError();
    if (!memberDetailPhoneResult?.isSucceed || !memberDetailPhoneResult.data)
      this.exceptionService.notSelectedEntity('member_detail_phone');
    const memberPhoneResult =
      await this.memberPhoneRepository.selectMemberPhoneById(
        memberDetailPhoneResult!.data!.memberPhoneId,
      );
    if (!memberPhoneResult) this.exceptionService.notRecognizedError();

    const member = memberEntireResult!.data!;
    const memberPhone = memberPhoneResult!.data;

    let phone: { countryCallingCode: string; phoneNumber: string } | null =
      null;
    if (memberPhone)
      phone = {
        countryCallingCode: memberPhone.countryCallingCode,
        phoneNumber: memberPhone.phoneNumber,
      };

    return new MemberEntireResponseRead(
      member.createdAt,
      member.isConsentedTermsAndConditions === 1,
      member.isConsentedCollectionAndUsePersonalData === 1,
      member.isConsentedMarketingUseAndInformationReceiving === 1,
      member.name,
      member.email,
      phone,
    );
  }
}
