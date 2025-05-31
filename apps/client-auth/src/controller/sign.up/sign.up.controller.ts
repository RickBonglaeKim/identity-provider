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
import * as cryptoJS from 'crypto-js';
import { SignUpService } from '../../service/sign.up/sign.up.service';
import { SignUpRequestCreate } from 'dto/interface/sign.up/request/sign.up.request.create.dto';
import { SignUpWithPhoneRequestCreate } from 'dto/interface/sign.up/request/phone/sign.up.phone.request.create.dto';
import { OauthService } from '../../service/oauth/oauth.service';
import { ConfigService } from '@nestjs/config';
import { Transactional } from '@nestjs-cls/transactional';

@Controller('signUp')
@UseInterceptors(TransformInterceptor)
export class SignUpController {
  private readonly logger = new Logger(SignUpController.name);
  private readonly memberKeyEncryptionKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly signUpService: SignUpService,
    private readonly oauthService: OauthService,
  ) {
    this.memberKeyEncryptionKey = this.configService.getOrThrow<string>(
      'MEMBER_KEY_ENCRYPTION_KEY',
    );
  }

  @Post()
  @Transactional()
  async postSignUp(
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignUpRequestCreate,
  ): Promise<void | string> {
    this.logger.debug('postSignUp');
    const result = await this.signUpService.createSignUpWithoutDuplication(dto);
    if (!result) {
      response.status(251);
      return;
    }

    if (!dto.passport) return;

    const passport = await this.oauthService.findPassport(dto.passport);
    if (!passport) {
      throw new HttpException(
        'The passport was not found',
        HttpStatus.FORBIDDEN,
      );
    }

    const memberKey = this.oauthService.createMemberKey({
      memberId: result.memberId,
      memberDetailId: result.memberDetailId,
      passportKey: dto.passport,
      timestamp: Date.now(),
    });
    if (!memberKey) {
      throw new HttpException(
        'The member key was not created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return memberKey;
  }

  @Post('/phone')
  @Transactional()
  async postSignUpWithPhone(
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignUpWithPhoneRequestCreate,
  ): Promise<void | string> {
    const result = await this.signUpService.createSignUpWithPhone(dto);
    if (!result) {
      response.status(251);
      return;
    }

    if (!dto.passport) return;

    const passport = await this.oauthService.findPassport(dto.passport);
    if (!passport) {
      throw new HttpException(
        'The passport was not found',
        HttpStatus.FORBIDDEN,
      );
    }

    const memberKey = this.oauthService.createMemberKey({
      memberId: result.memberId,
      memberDetailId: result.memberDetailId,
      passportKey: dto.passport,
      timestamp: Date.now(),
    });
    if (!memberKey) {
      throw new HttpException(
        'The member key was not created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return memberKey;
  }
}
