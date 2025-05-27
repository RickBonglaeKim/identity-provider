import { Injectable, Logger } from '@nestjs/common';
import { SignupService } from '../sign.up/sign.up.service';
import { HashService } from '@app/crypto/service/hash/hash.service';
import { SignRepository } from '@app/persistence/schema/main/repository/sign.repository';
import { ExceptionService } from '@app/exception/service/exception.service';
import { SignMember } from '../../type/service/sign.service.type';

@Injectable()
export class SigninService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly signRepository: SignRepository,
    private readonly hashService: HashService,
    private readonly exceptionService: ExceptionService,
  ) {}

  async findMember(
    id: string,
    password: string,
  ): Promise<SignMember | undefined> {
    const signinResult = await this.signRepository.verifyMemberByEmail(id);
    if (!signinResult) {
      this.logger.debug('Signin result is undefined');
      return;
    }
    if (!signinResult.isSucceed || !signinResult.data) {
      this.logger.debug('No member found with the given email');
      return;
    }

    this.logger.debug(
      `findMember.id -> ${id}, findMember.password -> ${password}`,
      `findMember.signinResult -> ${JSON.stringify(signinResult)}`,
    );

    const members = signinResult.data;
    if (!Array.isArray(members)) {
      this.logger.debug('Signin result data is not an array');
      return;
    }

    let memberResult: SignMember | undefined;
    for (const member of members) {
      if (!member || !member.password) {
        this.logger.debug('Member or password is undefined');
        continue;
      }

      const isVerifiedPassword = await this.hashService.compareHash(
        password,
        member.password,
      );

      this.logger.debug(
        `findMember.signinResult.data -> ${JSON.stringify(member)}`,
        `findMember.isVerifiedPassword -> ${isVerifiedPassword}`,
      );

      if (isVerifiedPassword) {
        memberResult = {
          memberId: member.memberId,
          memberDetailId: member.memberDetailId,
        };
        break;
      }
    }

    return memberResult;
  }

  async findMemberByEmailAndPassword(
    email: string,
    password: string, // ID of provider (Kakao, Naver, Google, Apple, etc.)
  ): Promise<SignMember | undefined> {
    const signinResult =
      await this.signRepository.verifyMemberByEmailAndPassword(email, password);
    if (!signinResult) {
      this.logger.debug('Signin result is undefined');
      return;
    }
    if (!signinResult.isSucceed || !signinResult.data) {
      this.logger.debug('No member found with the given email and password');
      return;
    }

    this.logger.debug(
      `findMemberByEmailAndPassword.signinResult -> ${JSON.stringify(signinResult)}`,
    );

    return {
      memberId: signinResult.data.memberId,
      memberDetailId: signinResult.data.memberDetailId,
    };
  }

  async findMemberByProvider(
    providerPassword: string,
  ): Promise<SignMember | undefined> {
    const signinResult =
      await this.signRepository.verifyMemberByPassword(providerPassword);
    if (!signinResult) {
      this.logger.debug('Signin result is undefined');
      return;
    }
    if (!signinResult.isSucceed || !signinResult.data) {
      this.logger.debug('No member found with the given provider password');
      return;
    }

    this.logger.debug(
      `findMemberByProvider.signinResult -> ${JSON.stringify(signinResult)}`,
    );

    return {
      memberId: signinResult.data.memberId,
      memberDetailId: signinResult.data.memberDetailId,
    };
  }
}
