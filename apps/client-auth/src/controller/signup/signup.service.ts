import { MemberRepository } from '@app/persistence/module/main/repository/member.repository';
import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(private readonly memberRepository: MemberRepository) {}

  @Transactional()
  async createSignup() {
    const result = await this.memberRepository.insertMember({
      clientKey: 'ART_STATION.WEB',
      isAgreedPrivacy: 1,
      isAgreedTerms: 1,
      isAgreedMarketing: 0,
      isMoreThanFourteen: 1,
    });
    this.logger.debug(result);
    // throw new Error('Transaction test...');
  }
}
