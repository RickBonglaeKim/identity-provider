import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { VerificationService } from '../../service/verification/verification.service';
import { VerificationPhoneRequestCreate } from 'dto/interface/verification/phone/request/verification.phone.request.create.dto';
import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { VerificationEmailRequestCreate } from 'dto/interface/verification/email/request/verification.email.request.create.dto';
import { VerificationEmailRequestRead } from 'dto/interface/verification/email/request/verification.email.request.read.dto';
import { VerificationPhoneRequestRead } from 'dto/interface/verification/phone/request/verification.phone.request.read.dto';
import trimPhoneNumber from '../../util/trim.phoneNumber';
import { OauthService } from '../../service/oauth/oauth.service';
import { Passport } from '../../decorator/passport.decorator';
import { VerificationFindIdRequestRead } from 'dto/interface/verification/find/request/verification.find.id.request.read.dto';
import { VerificationFindPasswordRequestRead } from 'dto/interface/verification/find/request/verification.find.password.request.read.dto';
import { VerificationResetPasswordRequestCreate } from 'dto/interface/verification/reset/request/verification.reset.password.request.create.dto';
import ERROR_MESSAGE from 'dto/constant/http.error.message.constant';
import SUCCESS_HTTP_STATUS from 'dto/constant/http.status.constant';

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
    @Query() dto: VerificationPhoneRequestCreate,
    @Passport() passportKey: string,
  ): Promise<void> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
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
        ERROR_MESSAGE.VERIFICATION_CODE_NOT_GENERATED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }

  @Get('phone/check')
  async getVerifyPhoneCheck(
    @Query() dto: VerificationPhoneRequestCreate,
    @Passport() passportKey: string,
  ): Promise<boolean> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
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
    @Passport() passportKey: string,
  ): Promise<boolean> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }
    const result = await this.verificationService.getPhoneVerificationCode(
      dto.countryCallingCode,
      trimPhoneNumber(dto.phoneNumber),
    );
    if (!result)
      throw new HttpException(
        ERROR_MESSAGE.VERIFICATION_CODE_NOT_FOUND,
        SUCCESS_HTTP_STATUS.DATA_NOT_FOUND,
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
        ERROR_MESSAGE.VERIFICATION_CODE_NOT_FOUND,
        SUCCESS_HTTP_STATUS.DATA_NOT_FOUND,
      );
    return code;
  }

  @Get('email')
  async getVerifyEmail(
    @Query() dto: VerificationEmailRequestCreate,
    @Passport() passportKey: string,
  ): Promise<void> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }
    const isGenerated = await this.verificationService.setEmailVerificationCode(
      dto.email,
    );
    this.logger.debug(`getVerifyEmail.isGenerated -> ${isGenerated}`);
    if (!isGenerated)
      throw new HttpException(
        ERROR_MESSAGE.VERIFICATION_CODE_NOT_GENERATED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }

  @Get('email/check')
  async getVerifyEmailCheck(
    @Query() dto: VerificationEmailRequestCreate,
    @Passport() passportKey: string,
  ): Promise<boolean> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }
    return await this.verificationService.verifyEmail(dto.email);
  }

  @Get('email/code')
  async getVerifyEmailCode(
    @Query() dto: VerificationEmailRequestRead,
    @Passport() passportKey: string,
  ): Promise<boolean> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }
    const result = await this.verificationService.getEmailVerificationCode(
      dto.email,
    );
    if (!result)
      throw new HttpException(
        ERROR_MESSAGE.VERIFICATION_CODE_NOT_FOUND,
        SUCCESS_HTTP_STATUS.DATA_NOT_FOUND,
      );
    return dto.verificationCode === result;
  }

  @Get('email/get')
  async getEmailVerifiedCode(
    @Query() dto: VerificationEmailRequestCreate,
  ): Promise<string> {
    const code = await this.verificationService.getEmailVerificationCode(
      dto.email,
    );
    if (!code)
      throw new HttpException(
        ERROR_MESSAGE.VERIFICATION_CODE_NOT_FOUND,
        SUCCESS_HTTP_STATUS.DATA_NOT_FOUND,
      );
    return code;
  }

  @Get('find/id')
  async getFindId(
    @Passport() passportKey: string,
    @Query() dto: VerificationFindIdRequestRead,
  ): Promise<string> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }
    const result = await this.verificationService.findId(
      dto.name,
      dto.countryCallingCode,
      trimPhoneNumber(dto.phoneNumber),
    );
    if (!result)
      throw new HttpException(
        ERROR_MESSAGE.USER_NOT_FOUND,
        SUCCESS_HTTP_STATUS.DATA_NOT_FOUND,
      );
    return result;
  }

  @Get('find/password')
  async getFindPassword(
    @Passport() passportKey: string,
    @Query() dto: VerificationFindPasswordRequestRead,
  ): Promise<string> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }

    const result = await this.verificationService.findPassword(
      dto.email,
      dto.countryCallingCode,
      trimPhoneNumber(dto.phoneNumber),
    );
    if (!result) {
      throw new HttpException(
        ERROR_MESSAGE.USER_NOT_FOUND,
        SUCCESS_HTTP_STATUS.DATA_NOT_FOUND,
      );
    }

    const token = await this.verificationService.setPasswordToken(
      result.toString(),
    );
    if (!token) {
      throw new HttpException(
        ERROR_MESSAGE.PASSWORD_TOKEN_WAS_NOT_GENERATED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    this.logger.debug(`getFindPassword.token -> ${token}`);
    return token;
  }

  @Patch('reset/password')
  async patchResetPassword(
    @Passport() passportKey: string,
    @Body() dto: VerificationResetPasswordRequestCreate,
  ): Promise<void> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }

    const tokenResult = await this.verificationService.getPasswordToken(
      dto.token,
    );
    if (!tokenResult) {
      throw new HttpException(
        ERROR_MESSAGE.PASSWORD_TOKEN_NOT_FOUND,
        SUCCESS_HTTP_STATUS.DATA_NOT_FOUND,
      );
    }

    const result = await this.verificationService.resetPassword(
      parseInt(tokenResult, 10),
      dto.password,
    );
    if (!result) {
      throw new HttpException(
        ERROR_MESSAGE.PASSWORD_NOT_UPDATED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return;
  }
}
