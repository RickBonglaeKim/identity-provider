import { HashService } from '@app/crypto/hash/hash.service';
import { ExceptionService } from '@app/exception/exception.service';
import { MemberDetailRepository } from '@app/persistence/schema/main/repository/member.detail.repository';
import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { MemberDetailCreateRequest } from 'dto/interface/member.detail/create/member.detail.create.request.dto';

@Injectable()
export class MemberDetailService {
  private readonly logger = new Logger(MemberDetailService.name);

  constructor(
    private readonly memberDetailRepository: MemberDetailRepository,
    private readonly exceptionService: ExceptionService,
    private readonly hashService: HashService,
  ) {}

  @Transactional()
  async createMemberDetail(
    memberDetailId: number,
    memberId: number,
    data: MemberDetailCreateRequest,
  ): Promise<number> {
    const hashPassword = await this.hashService.generateHash(data.password);

    const memberDetailResult =
      await this.memberDetailRepository.insertMemberDetail({
        memberDetailId: memberDetailId,
        providerKey: data.providerKey,
        memberId: memberId,
        name: data.name,
        email: data.email,
        password: hashPassword,
      });
    if (!memberDetailResult) this.exceptionService.notRecognizedError();

    if (!memberDetailResult?.isSucceed || !memberDetailResult?.data)
      this.exceptionService.notInsertedEntity('member detail');

    return memberDetailResult?.data as number;
  }
}
