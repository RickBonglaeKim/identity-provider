import { PasswordCacheRepository } from '@app/cache/repository/password.cache.repository';
import { VerificationCacheRepository } from '@app/cache/repository/verification.cache.repository';
import { ExceptionService } from '@app/exception/service/exception.service';
import { MemberDetailRepository } from '@app/persistence/schema/main/repository/member.detail.repository';
import { MemberPhoneRepository } from '@app/persistence/schema/main/repository/member.phone.repository';
import { MemberVerificationRepository } from '@app/persistence/schema/main/repository/member.verification.repository';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cryptoRandomString from 'crypto-random-string';
import { HashService } from '@app/crypto/service/hash/hash.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly exceptionService: ExceptionService,
    private readonly hashService: HashService,
    private readonly memberDetailRepository: MemberDetailRepository,
    private readonly memberPhoneRepository: MemberPhoneRepository,
    private readonly verificationCacheRepository: VerificationCacheRepository,
    private readonly passwordCacheRepository: PasswordCacheRepository,
    private readonly memberVerificationRepository: MemberVerificationRepository,
  ) {}

  private generateVerificationCode() {
    return cryptoRandomString({ length: 6, type: 'numeric' });
  }

  private createPhoneVerificationKey(
    countryCallingCode: string,
    phoneNumber: string,
  ): string {
    return `${countryCallingCode}+${phoneNumber}`;
  }

  async verifyPhone(
    countryCallingCode: string,
    phoneNumber: string,
  ): Promise<boolean> {
    const result =
      await this.memberPhoneRepository.selectMemberPhoneByCountryCallingCodeAndPhoneNumber(
        countryCallingCode,
        phoneNumber,
      );
    if (!result) this.exceptionService.notRecognizedError();
    if (result?.isSucceed) return false;
    return true;
  }

  async setPhoneVerificationCode(
    countryCallingCode: string,
    phoneNumber: string,
  ): Promise<boolean> {
    const code = this.generateVerificationCode();
    this.logger.debug(`setPhoneVerificationCode.code -> ${code}`);
    const phoneVerificationKey = this.createPhoneVerificationKey(
      countryCallingCode,
      phoneNumber,
    );
    const checkResult =
      await this.verificationCacheRepository.getVerificationCode(
        phoneVerificationKey,
      );

    if (
      checkResult.isSucceed &&
      !(
        await this.verificationCacheRepository.deleteVerificationCode(
          phoneVerificationKey,
        )
      ).isSucceed
    )
      return false;

    const result = await this.verificationCacheRepository.setVerificationCode(
      phoneVerificationKey,
      code,
    );
    return result.isSucceed;
  }

  async getPhoneVerificationCode(
    countryCallingCode: string,
    phoneNumber: string,
  ): Promise<string | undefined> {
    const result = await this.verificationCacheRepository.getVerificationCode(
      this.createPhoneVerificationKey(countryCallingCode, phoneNumber),
    );
    this.logger.debug(
      `getPhoneVerificationCode.result -> ${JSON.stringify(result)}`,
    );
    if (result.isSucceed) return result.data;
  }

  async verifyEmail(email: string): Promise<boolean> {
    const result =
      await this.memberDetailRepository.selectMemberDetailByEmail(email);
    if (!result) this.exceptionService.notRecognizedError();
    if (result?.isSucceed) return false;
    return true;
  }

  async setEmailVerificationCode(email: string): Promise<boolean> {
    const code = this.generateVerificationCode();
    this.logger.debug(`setEmailVerificationCode.code -> ${code}`);
    const checkResult =
      await this.verificationCacheRepository.getVerificationCode(email);

    if (
      checkResult.isSucceed &&
      !(await this.verificationCacheRepository.deleteVerificationCode(email))
        .isSucceed
    )
      return false;

    const codeResult =
      await this.verificationCacheRepository.setVerificationCode(email, code);
    this.logger.debug(
      `setEmailVerificationCode.result -> ${JSON.stringify(codeResult)}`,
    );
    return codeResult.isSucceed;
  }

  async getEmailVerificationCode(email: string): Promise<string | undefined> {
    const code = this.generateVerificationCode();
    this.logger.debug(`getPhoneVerificationCode.code -> ${code}`);
    const result =
      await this.verificationCacheRepository.getVerificationCode(email);
    if (result.isSucceed) return result.data;
  }

  async findId(
    name: string,
    countryCallingCode: string,
    phoneNumber: string,
  ): Promise<string | undefined> {
    const result =
      await this.memberVerificationRepository.selectMemberVerificationByNameAndCountryCallingCodeAndPhoneNumber(
        name,
        countryCallingCode,
        phoneNumber,
      );
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result?.data) return;

    return result.data.email;
  }

  async findPassword(
    email: string,
    countryCallingCode: string,
    phoneNumber: string,
  ): Promise<number | undefined> {
    const result =
      await this.memberVerificationRepository.selectMemberVerificationByEmailAndCountryCallingCodeAndPhoneNumber(
        email,
        countryCallingCode,
        phoneNumber,
      );
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result?.data) return;

    return result.data.memberDetailId;
  }

  async setPasswordToken(data: string): Promise<string | undefined> {
    const token = cryptoRandomString({ length: 16, type: 'alphanumeric' });
    this.logger.debug(`setPasswordToken.token -> ${token}`);
    const checkResult =
      await this.passwordCacheRepository.getPasswordToken(token);

    if (
      checkResult.isSucceed &&
      !(await this.passwordCacheRepository.deletePasswordToken(token)).isSucceed
    )
      return;

    const tokenResult = await this.passwordCacheRepository.setPasswordToken(
      token,
      data,
    );
    this.logger.debug(
      `setPasswordToken.tokenResult -> ${JSON.stringify(tokenResult)}`,
    );
    if (!tokenResult.isSucceed) return;
    return token;
  }

  async getPasswordToken(token: string): Promise<string | undefined> {
    const result = await this.passwordCacheRepository.getPasswordToken(token);
    if (result.isSucceed) return result.data;
  }

  async resetPassword(id: number, password: string): Promise<boolean> {
    const hashPassword = await this.hashService.generateHash(password);
    const result =
      await this.memberDetailRepository.updatePasswordOfMemberDetailById(
        id,
        hashPassword,
      );
    if (!result) this.exceptionService.notRecognizedError();
    return result!.isSucceed;
  }
}
