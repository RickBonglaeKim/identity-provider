import { ExceptionService } from '@app/exception/exception.service';
import { MemberPhoneRepository } from '@app/persistence/schema/main/repository/member.phone.repository';
import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { MemberPhoneCreateREquest } from 'dto/interface/member.phone/create/member.phone.create.request.dto';

@Injectable()
export class MemberPhoneService {
  private readonly logger = new Logger(MemberPhoneService.name);

  constructor(
    private readonly memberPhoneRepository: MemberPhoneRepository,
    private readonly exceptionService: ExceptionService,
  ) {}

  @Transactional()
  async createMemberPhone(
    memberId: number,
    data: MemberPhoneCreateREquest,
  ): Promise<number | null> {
    const memberPhoneData =
      await this.memberPhoneRepository.selectMemberDetailByMemberIdAndPhoneNumber(
        memberId,
        data.phoneNumber,
      );
    if (!memberPhoneData?.isSucceed || !memberPhoneData.data) return null;

    const memberPhoneResult =
      await this.memberPhoneRepository.insertMemberDetail({
        memberId: memberId,
        isPrimary: data.isPrimary ? 1 : 0,
        countryCallingCode: data.countryCallingCode,
        phoneNumber: data.phoneNumber,
      });
    if (!memberPhoneResult) this.exceptionService.notRecognizedError();
    if (!memberPhoneResult?.isSucceed || !memberPhoneResult?.data)
      this.exceptionService.notInsertedEntity('member detail');

    return memberPhoneResult?.data as number;
  }
}
