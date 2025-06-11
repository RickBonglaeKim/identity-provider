import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import {
  memberDetail,
  memberDetailPhone,
  memberPhone,
} from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { and, eq } from 'drizzle-orm';
import {
  selectMemberVerificationByEmailAndCountryCallingCodeAndPhoneNumber,
  selectMemberVerificationByNameAndCountryCallingCodeAndPhoneNumber,
} from '@app/persistence/entity/member.entity';

@Injectable()
export class MemberVerificationRepository extends MainSchemaService {
  private readonly logger = new Logger(MemberVerificationRepository.name);

  async selectMemberVerificationByNameAndCountryCallingCodeAndPhoneNumber(
    name: string,
    countryCallingCode: string,
    phoneNumber: string,
  ): Promise<
    | ResponseEntity<selectMemberVerificationByNameAndCountryCallingCodeAndPhoneNumber>
    | undefined
  > {
    try {
      const result = await this.mainTransaction.tx
        .select({
          memberId: memberDetail.memberId,
          memberDetailId: memberDetail.id,
          memberPhoneId: memberPhone.id,
          email: memberDetail.email,
        })
        .from(memberDetailPhone)
        .innerJoin(
          memberDetail,
          eq(memberDetail.id, memberDetailPhone.memberDetailId),
        )
        .innerJoin(
          memberPhone,
          eq(memberPhone.id, memberDetailPhone.memberPhoneId),
        )
        .where(
          and(
            eq(memberDetail.name, name),
            eq(memberPhone.countryCallingCode, countryCallingCode),
            eq(memberPhone.phoneNumber, phoneNumber),
          ),
        );
      if (result.length > 1) {
        throw new Error(
          'The data searched by memberDetail.name and memberPhone.countryCallingCode and memberPhone.phoneNumber is duplicated.',
        );
      }
      if (result.length === 0) {
        return new ResponseEntity<selectMemberVerificationByNameAndCountryCallingCodeAndPhoneNumber>(
          false,
        );
      }
      return new ResponseEntity<selectMemberVerificationByNameAndCountryCallingCodeAndPhoneNumber>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberVerificationByEmailAndCountryCallingCodeAndPhoneNumber(
    email: string,
    countryCallingCode: string,
    phoneNumber: string,
  ): Promise<
    | ResponseEntity<selectMemberVerificationByEmailAndCountryCallingCodeAndPhoneNumber>
    | undefined
  > {
    try {
      const result = await this.mainTransaction.tx
        .select({
          memberId: memberDetail.memberId,
          memberDetailId: memberDetail.id,
          memberPhoneId: memberPhone.id,
        })
        .from(memberDetailPhone)
        .innerJoin(
          memberDetail,
          eq(memberDetail.id, memberDetailPhone.memberDetailId),
        )
        .innerJoin(
          memberPhone,
          eq(memberPhone.id, memberDetailPhone.memberPhoneId),
        )
        .where(
          and(
            eq(memberDetail.email, email),
            eq(memberPhone.countryCallingCode, countryCallingCode),
            eq(memberPhone.phoneNumber, phoneNumber),
          ),
        );
      if (result.length > 1) {
        throw new Error(
          'The data searched by memberDetail.email and memberPhone.countryCallingCode and memberPhone.phoneNumber is duplicated.',
        );
      }
      if (result.length === 0) {
        return new ResponseEntity<selectMemberVerificationByEmailAndCountryCallingCodeAndPhoneNumber>(
          false,
        );
      }
      return new ResponseEntity<selectMemberVerificationByEmailAndCountryCallingCodeAndPhoneNumber>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
