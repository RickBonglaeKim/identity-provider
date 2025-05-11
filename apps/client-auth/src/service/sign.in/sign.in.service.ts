import { Injectable, Logger } from '@nestjs/common';
import { SignupService } from '../sign.up/sign.up.service';
import { HashService } from '@app/crypto/hash/hash.service';
import { SignRepository } from '@app/persistence/schema/main/repository/sign.repository';
import { ExceptionService } from '@app/exception/exception.service';

@Injectable()
export class SigninService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly signRepository: SignRepository,
    private readonly hashService: HashService,
    private readonly exceptionService: ExceptionService,
  ) {}

  async findMember(id: string, password: string): Promise<number | null> {
    const signinResult = await this.signRepository.verifyMemberByEmail(id);
    if (!signinResult) this.exceptionService.notRecognizedError();
    if (!signinResult?.isSucceed || !signinResult?.data) return null;
    this.logger.debug(
      `findMember.id -> ${id}, findMember.password -> ${password}`,
      `findMember.signinResult -> ${JSON.stringify(signinResult)}`,
    );
    let memberId: number | null = null;
    for (const member of signinResult.data) {
      const isVerifiedPassword = await this.hashService.compareHash(
        password,
        member.password,
      );
      this.logger.debug(
        `findMember.signinResult.data -> ${JSON.stringify(member)}`,
        `findMember.isVerifiedPassword -> ${isVerifiedPassword}`,
      );
      if (isVerifiedPassword) {
        memberId = member.memberId;
        break;
      }
    }
    return memberId;
  }
}
