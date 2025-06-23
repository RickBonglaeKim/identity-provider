import { Injectable, Logger } from '@nestjs/common';
import { SignUpService } from '../sign.up/sign.up.service';
import { HashService } from '@app/crypto/service/hash/hash.service';
import { SignRepository } from '@app/persistence/schema/main/repository/sign.repository';
import { ExceptionService } from '@app/exception/service/exception.service';
import { SignMember } from '../../type/service/sign.service.type';
import { Providers } from 'dto/enum/provider.enum';

@Injectable()
export class SignInService {
  private readonly logger = new Logger(SignUpService.name);

  constructor(
    private readonly signRepository: SignRepository,
    private readonly hashService: HashService,
    private readonly exceptionService: ExceptionService,
  ) {}

  async findMember(
    providerId: Providers,
    id: string,
    password: string,
  ): Promise<SignMember | undefined> {
    const signInResult = await this.signRepository.verifyMemberByEmail(
      id,
      providerId,
    );
    if (!signInResult) {
      this.logger.debug('SignIn result is undefined');
      return;
    }
    if (!signInResult.isSucceed || !signInResult.data) {
      this.logger.debug('No member found with the given email');
      return;
    }

    this.logger.debug(
      `findMember.id -> ${id}, findMember.password -> ${password}`,
      `findMember.signInResult -> ${JSON.stringify(signInResult)}`,
    );

    const members = signInResult.data;
    if (!Array.isArray(members)) {
      this.logger.debug('SignIn result data is not an array');
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
        `findMember.signInResult.data -> ${JSON.stringify(member)}`,
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
    const signInResult =
      await this.signRepository.verifyMemberByEmailAndPassword(email, password);
    if (!signInResult) {
      this.logger.debug('SignIn result is undefined');
      return;
    }
    if (!signInResult.isSucceed || !signInResult.data) {
      this.logger.debug('No member found with the given email and password');
      return;
    }

    this.logger.debug(
      `findMemberByEmailAndPassword.signInResult -> ${JSON.stringify(signInResult)}`,
    );

    return {
      memberId: signInResult.data.memberId,
      memberDetailId: signInResult.data.memberDetailId,
    };
  }

  async findMemberByMemberProvider(
    memberProviderKey: string,
  ): Promise<SignMember | undefined> {
    const signInResult =
      await this.signRepository.verifyMemberByMemberProviderKey(
        memberProviderKey,
      );
    if (!signInResult) {
      this.logger.debug('SignIn result is undefined');
      return;
    }
    if (!signInResult.isSucceed || !signInResult.data) {
      this.logger.debug('No member found with the given memberProviderKey');
      return;
    }

    this.logger.debug(
      `findMemberByProvider.signInResult -> ${JSON.stringify(signInResult)}`,
    );

    return {
      memberId: signInResult.data.memberId,
      memberDetailId: signInResult.data.memberDetailId,
    };
  }
}
