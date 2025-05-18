import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { Controller, Get, Logger, Req, UseInterceptors } from '@nestjs/common';
import { OauthController } from '../oauth/oauth.controller';
import { ConfigService } from '@nestjs/config';
import { ChildService } from '../../service/child/child.service';
import { MemberService } from '../../service/member/member.service';
import * as cryptoJS from 'crypto-js';
import { Request } from 'express';
import { CookieValue } from '../../type/service/sign.service.type';
import { MemberEntireRepository } from '@app/persistence/schema/main/repository/member.entire.repository';
import { MemberDetailPhoneRepository } from '@app/persistence/schema/main/repository/member.detail.phone.repository';
import { ExceptionService } from '@app/exception/service/exception.service';
import { MemberPhoneRepository } from '@app/persistence/schema/main/repository/member.phone.repository';

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

  // @Get('entire')
  // async getEntireMember(@Req() request: Request): Promise<> {
  //   const encryptedCookieValue = request.cookies['iScreamArts-IDP'] as string;
  //   this.logger.debug(`getEntireMember.signMember -> ${encryptedCookieValue}`);
  //   const decryptedCookieValue = cryptoJS.AES.decrypt(
  //     encryptedCookieValue,
  //     this.cookieEncryptionKey,
  //   ).toString(cryptoJS.enc.Utf8);
  //   const signMember = JSON.parse(decryptedCookieValue) as CookieValue;
  //   this.logger.debug(
  //     `getEntireMember.signMember -> ${JSON.stringify(signMember)}`,
  //   );

  //   const memberResult =
  //     await this.memberEntireRepository.selectMemberAndMemberDetailAndProviderByMemberDetailId(
  //       signMember.memberDetailId,
  //     );
  //   if (!memberResult) this.exceptionService.notRecognizedError();
  //   if (!memberResult?.isSucceed || memberResult.data)
  //     this.exceptionService.notSelectedEntity('member');
  //   const memberDetailPhoneResult =
  //     await this.memberDetailPhoneRepository.selectMemberDetailByMemberDetailId(
  //       signMember.memberDetailId,
  //     );
  //   if (!memberDetailPhoneResult) this.exceptionService.notRecognizedError();
  //   if (!memberDetailPhoneResult?.isSucceed || !memberDetailPhoneResult.data)
  //     this.exceptionService.notSelectedEntity('member_detail_phone');
  //   const memberPhoneResult = this.memberPhoneRepository.selectMemberPhoneById(
  //     memberDetailPhoneResult!.data!.memberPhoneId,
  //   );

  //   return 

  // }
}
