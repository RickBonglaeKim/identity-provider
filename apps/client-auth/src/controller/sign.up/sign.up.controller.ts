import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Res,
  Headers,
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
    @Headers('passport') passportKey: string,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignUpRequestCreate,
  ): Promise<void | string> {
    if (!passportKey) {
      throw new HttpException(
        'The passport is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        'The passport was not found',
        HttpStatus.FORBIDDEN,
      );
    }

    const result = await this.signUpService.createSignUpWithoutDuplication(dto);
    if (!result) {
      response.status(251);
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
        'The member key was not created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return memberKey;
  }

  @Post('/phone')
  @Transactional()
  async postSignUpWithPhone(
    @Headers('passport') passportKey: string,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignUpWithPhoneRequestCreate,
  ): Promise<void | string> {
    if (!passportKey) {
      throw new HttpException(
        'The passport is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        'The passport was not found',
        HttpStatus.FORBIDDEN,
      );
    }

    const result = await this.signUpService.createSignUpWithPhone(dto);
    if (!result) {
      response.status(251);
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
        'The member key was not created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return memberKey;
  }
}
