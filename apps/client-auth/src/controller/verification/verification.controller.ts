import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Query,
  Res,
  Headers,
  UseInterceptors,
} from '@nestjs/common';
import { VerificationService } from '../../service/verification/verification.service';
import { PassportCacheRepository } from '@app/cache/repository/passport.cache.repository';
import { VerificationPhoneRequestCreate } from 'dto/interface/verification/phone/request/verification.phone.request.create.dto';
import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { VerificationEmailRequestCreate } from 'dto/interface/verification/email/request/verification.email.request.create.dto';
import { Response } from 'express';
import { VerificationEmailRequestRead } from 'dto/interface/verification/email/request/verification.email.request.read.dto';
import { VerificationPhoneRequestRead } from 'dto/interface/verification/phone/request/verification.phone.request.read.dto';
import trimPhoneNumber from '../../util/trim.phoneNumber';
import { OauthService } from '../../service/oauth/oauth.service';

@Controller('verification')
@UseInterceptors(TransformInterceptor)
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(
    private readonly verificationService: VerificationService,
    private readonly oauthService: OauthService,
  ) {}

  @Get('phone')
  async getVerifyPhone(
    @Res({ passthrough: true }) response: Response,
    @Query() dto: VerificationPhoneRequestCreate,
    @Headers('passport') passportKey: string,
  ): Promise<void> {
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

    const isGenerated = await this.verificationService.setPhoneVerificationCode(
      dto.countryCallingCode,
      trimPhoneNumber(dto.phoneNumber),
    );
    this.logger.debug(`getVerifyPhone.isGenerated -> ${isGenerated}`);
    if (!isGenerated)
      throw new HttpException(
        'The verification code is not generated.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }

  @Get('phone/check')
  async getVerifyPhoneCheck(
    @Query() dto: VerificationPhoneRequestCreate,
    @Headers('passport') passportKey: string,
  ): Promise<boolean> {
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
    return await this.verificationService.verifyPhone(
      dto.countryCallingCode,
      trimPhoneNumber(dto.phoneNumber),
    );
  }

  @Get('phone/code')
  async getVerifyPhoneCode(
    @Query() dto: VerificationPhoneRequestRead,
    @Headers('passport') passportKey: string,
  ): Promise<boolean> {
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
    const result = await this.verificationService.getPhoneVerificationCode(
      dto.countryCallingCode,
      trimPhoneNumber(dto.phoneNumber),
    );
    if (!result)
      throw new HttpException(
        'The verification code does not exist.',
        HttpStatus.GONE,
      );
    return dto.verificationCode === result;
  }

  @Get('phone/get')
  async getPhoneVerifiedCode(@Query() dto: VerificationPhoneRequestCreate) {
    const code = await this.verificationService.getPhoneVerificationCode(
      dto.countryCallingCode,
      trimPhoneNumber(dto.phoneNumber),
    );
    if (!code)
      throw new HttpException(
        'The verification code does not exist.',
        HttpStatus.GONE,
      );
    return code;
  }

  @Get('email')
  async getVerifyEmail(
    @Res({ passthrough: true }) response: Response,
    @Query() dto: VerificationEmailRequestCreate,
    @Headers('passport') passportKey: string,
  ): Promise<void> {
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
    const isGenerated = await this.verificationService.setEmailVerificationCode(
      dto.email,
    );
    this.logger.debug(`getVerifyEmail.isGenerated -> ${isGenerated}`);
    if (!isGenerated)
      throw new HttpException(
        'The verification code is not generated.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }

  @Get('email/check')
  async getVerifyEmailCheck(
    @Query() dto: VerificationEmailRequestCreate,
    @Headers('passport') passportKey: string,
  ): Promise<boolean> {
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
    return await this.verificationService.verifyEmail(dto.email);
  }

  @Get('email/code')
  async getVerifyEmailCode(
    @Query() dto: VerificationEmailRequestRead,
    @Headers('passport') passportKey: string,
  ): Promise<boolean> {
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
    const result = await this.verificationService.getEmailVerificationCode(
      dto.email,
    );
    if (!result)
      throw new HttpException(
        'The verification code does not exist.',
        HttpStatus.GONE,
      );
    return dto.verificationCode === result;
  }

  @Get('email/get')
  async getEmailVerifiedCode(@Query() dto: VerificationEmailRequestCreate) {
    const code = await this.verificationService.getEmailVerificationCode(
      dto.email,
    );
    if (!code)
      throw new HttpException(
        'The verification code does not exist.',
        HttpStatus.GONE,
      );
    return code;
  }

  @Get('find/id')
  async getFindId() {}

  @Get('find/password')
  async getFindPassword() {}

  @Patch('reset/password')
  async patchResetPassword() {}
}
