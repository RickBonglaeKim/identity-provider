import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { SignUpService } from '../../service/sign.up/sign.up.service';
import { SignUpRequestCreate } from 'dto/interface/sign.up/request/sign.up.request.create.dto';
import { SignUpWithPhoneRequestCreate } from 'dto/interface/sign.up/request/phone/sign.up.phone.request.create.dto';
import { OauthService } from '../../service/oauth/oauth.service';
import { Transactional } from '@nestjs-cls/transactional';
import { Passport } from '../../decorator/passport.decorator';
import ERROR_MESSAGE from 'dto/constant/http.error.message.constant';
import SUCCESS_HTTP_STATUS from 'dto/constant/http.status.constant';
import { ChildService } from '../../service/child/child.service';

@Controller('signUp')
@UseInterceptors(TransformInterceptor)
export class SignUpController {
  private readonly logger = new Logger(SignUpController.name);

  constructor(
    private readonly signUpService: SignUpService,
    private readonly oauthService: OauthService,
    private readonly childService: ChildService,
  ) {}

  // Not used yet
  @Post()
  @Transactional()
  async postSignUp(
    @Passport() passportKey: string,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignUpRequestCreate,
  ): Promise<void | string> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }

    const result = await this.signUpService.createSignUpWithoutDuplication(dto);
    if (!result) {
      response.status(SUCCESS_HTTP_STATUS.DATA_DUPLICATED);
      return;
    }

    const memberKey = this.oauthService.createMemberKey({
      memberId: result.memberId,
      memberDetailId: result.memberDetailId,
      passportKey: passportKey,
      timestamp: Date.now(),
    });
    if (!memberKey) {
      throw new HttpException(
        ERROR_MESSAGE.MEMBER_KEY_NOT_CREATED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return memberKey;
  }

  @Post('/phone')
  @Transactional()
  async postSignUpWithPhone(
    @Passport() passportKey: string,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignUpWithPhoneRequestCreate,
  ): Promise<void | string> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }

    const result = await this.signUpService.createSignUpWithPhone(dto);
    if (!result) {
      response.status(SUCCESS_HTTP_STATUS.DATA_DUPLICATED);
      return;
    }

    const memberKey = this.oauthService.createMemberKey({
      memberId: result.memberId,
      memberDetailId: result.memberDetailId,
      passportKey: passportKey,
      timestamp: Date.now(),
    });
    if (!memberKey) {
      throw new HttpException(
        ERROR_MESSAGE.MEMBER_KEY_NOT_CREATED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Get children from ArtBonBon
    this.childService.getChildrenFromArtBonBon(dto.memberPhone.phoneNumber);
    return memberKey;
  }
}
