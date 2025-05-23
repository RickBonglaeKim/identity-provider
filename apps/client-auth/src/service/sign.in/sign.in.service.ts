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
      this.logger.error('Signin result is undefined');
      return undefined;
    }
    if (!signinResult.isSucceed || !signinResult.data) {
      this.logger.error('No member found with the given email');
      return undefined;
    }

    this.logger.debug(
      `findMember.id -> ${id}, findMember.password -> ${password}`,
      `findMember.signinResult -> ${JSON.stringify(signinResult)}`,
    );

    const members = signinResult.data;
    if (!Array.isArray(members)) {
      this.logger.error('Signin result data is not an array');
      return undefined;
    }

    let memberResult: SignMember | undefined;
    for (const member of members) {
      if (!member || !member.password) {
        this.logger.error('Member or password is undefined');
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
}
