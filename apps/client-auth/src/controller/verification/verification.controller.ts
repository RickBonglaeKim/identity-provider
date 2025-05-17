import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { VerificationService } from '../../service/verification/verification.service';
import { PassportCacheRepository } from '@app/cache/repository/passport.cache.repository';
import { VerificationPhoneRequestCreate } from 'dto/interface/verification/request/verification.phone.request.create.dto';
import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { VerificationEmailRequestCreate } from 'dto/interface/verification/request/verification.email.request.create.dto';

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
    @Query() dto: VerificationPhoneRequestCreate,
  ): Promise<boolean> {
    // const passportResult = await this.passportCacheRepository.getPassport(
    //   dto.passport,
    // );
    // if (!passportResult.isSucceed)
    //   throw new HttpException(
    //     'The passport does not exist.',
    //     HttpStatus.UNAUTHORIZED,
    //   );
    const isVerified = await this.verificationService.verifyPhone(
      dto.countryCallingCode,
      dto.phoneNumber,
    );
    return isVerified;
  }

  @Post('phone')
  async postGeneratePhoneCode(@Body() dto: VerificationPhoneRequestCreate) {
    const isGenerated = await this.verificationService.setPhoneVerificationCode(
      dto.countryCallingCode,
      dto.phoneNumber,
    );
    return isGenerated;
  }

  @Get('phone/get')
  async getPhoneVerifiedCode(@Query() dto: VerificationPhoneRequestCreate) {
    const code = await this.verificationService.getPhoneVerificationCode(
      dto.countryCallingCode,
      dto.phoneNumber,
    );
    if (!code)
      throw new HttpException(
        'The verification code does not exist.',
        HttpStatus.UNAUTHORIZED,
      );
    return code;
  }

  @Get('email')
  async getVerifyEmail(
    @Query() dto: VerificationEmailRequestCreate,
  ): Promise<boolean> {
    // const passportResult = await this.passportCacheRepository.getPassport(
    //   dto.passport,
    // );
    // if (!passportResult.isSucceed)
    //   throw new HttpException(
    //     'The passport does not exist.',
    //     HttpStatus.UNAUTHORIZED,
    //   );
    const isVerified = await this.verificationService.verifyEmail(dto.email);
    return isVerified;
  }

  @Post('email')
  async postGenerateEmailCode(
    @Body() dto: VerificationEmailRequestCreate,
  ): Promise<boolean> {
    const isGenerated = await this.verificationService.setEmailVerificationCode(
      dto.email,
    );
    return isGenerated;
  }

  @Get('email/get')
  async getEmailVerifiedCode(@Query() dto: VerificationEmailRequestCreate) {
    const code = await this.verificationService.getEmailVerificationCode(
      dto.email,
    );
    if (!code)
      throw new HttpException(
        'The verification code does not exist.',
        HttpStatus.UNAUTHORIZED,
      );
    return code;
  }
}
