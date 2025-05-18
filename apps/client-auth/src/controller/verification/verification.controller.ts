import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
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

@Controller('verification')
@UseInterceptors(TransformInterceptor)
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(
    private readonly verificationService: VerificationService,
    private readonly passportCacheRepository: PassportCacheRepository,
  ) {}

  @Get('phone')
  async getVerifyPhone(
    @Res({ passthrough: true }) response: Response,
    @Query() dto: VerificationPhoneRequestCreate,
  ): Promise<void> {
    const isVerified = await this.verificationService.verifyPhone(
      dto.countryCallingCode,
      trimPhoneNumber(dto.phoneNumber),
    );
    this.logger.debug(`getVerifyPhone.isVerified -> ${isVerified}`);
    if (!isVerified) {
      response.status(251);
      return;
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

  @Get('phone/code')
  async getVerifyPhoneCode(
    @Query() dto: VerificationPhoneRequestRead,
  ): Promise<boolean> {
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
  ): Promise<void> {
    const isVerified = await this.verificationService.verifyEmail(dto.email);
    this.logger.debug(`getVerifyEmail.isVerified -> ${isVerified}`);
    if (!isVerified) {
      response.status(251);
      return;
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

  @Get('email/code')
  async getVerifyEmailCode(
    @Query() dto: VerificationEmailRequestRead,
  ): Promise<boolean> {
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
}
