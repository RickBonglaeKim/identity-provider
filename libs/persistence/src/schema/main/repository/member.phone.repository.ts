import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import { memberPhone } from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { and, eq } from 'drizzle-orm';
import { SelectMemberPhoneByCountryCallingCodeAndPhoneNumber } from '@app/persistence/entity/member.entity';

@Injectable()
export class MemberPhoneRepository extends MainSchemaService {
  private readonly logger = new Logger(MemberPhoneRepository.name);

  async insertMemberPhone(
    data: typeof memberPhone.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.insert(memberPhone).values(data)
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.insertId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberPhoneByMemberIdAndPhoneNumber(
    memberId: number,
    phoneNumber: string,
  ): Promise<ResponseEntity<typeof memberPhone.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(memberPhone)
        .where(
          and(
            eq(memberPhone.memberId, memberId),
            eq(memberPhone.phoneNumber, phoneNumber),
          ),
        );
      if (result.length > 1) {
        throw new Error(
          'The data searched by memberPhone.memberId and memberPhone.phoneNumber is duplicated.',
        );
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof memberPhone.$inferSelect>(false);
      }
      return new ResponseEntity<typeof memberPhone.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberPhoneById(
    id: number,
  ): Promise<ResponseEntity<typeof memberPhone.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(memberPhone)
        .where(eq(memberPhone.id, id));
      if (result.length > 1) {
        throw new Error('The data searched by memberPhone.id is duplicated.');
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof memberPhone.$inferSelect>(false);
      }
      return new ResponseEntity<typeof memberPhone.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberPhoneByMemberId(
    memberId: number,
  ): Promise<ResponseEntity<(typeof memberPhone.$inferSelect)[]> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(memberPhone)
        .where(eq(memberPhone.memberId, memberId));
      if (result.length === 0) {
        return new ResponseEntity<(typeof memberPhone.$inferSelect)[]>(false);
      }
      return new ResponseEntity<(typeof memberPhone.$inferSelect)[]>(
        true,
        result,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberPhoneByDistinctCountryCallingCodeAndPhoneNumber(
    countryCallingCode: string,
    phoneNumber: string,
  ): Promise<
    | ResponseEntity<SelectMemberPhoneByCountryCallingCodeAndPhoneNumber>
    | undefined
  > {
    try {
      const result = await this.mainTransaction.tx
        .selectDistinct({
          countryCallingCode: memberPhone.countryCallingCode,
          phoneNumber: memberPhone.phoneNumber,
        })
        .from(memberPhone)
        .where(
          and(
            eq(memberPhone.countryCallingCode, countryCallingCode),
            eq(memberPhone.phoneNumber, phoneNumber),
          ),
        );
      if (result.length > 1) {
        throw new Error(
          'The data searched by memberPhone.countryCallingCode and memberPhone.phoneNumber is duplicated.',
        );
      }
      if (result.length === 0) {
        return new ResponseEntity<SelectMemberPhoneByCountryCallingCodeAndPhoneNumber>(
          false,
        );
      }
      return new ResponseEntity<SelectMemberPhoneByCountryCallingCodeAndPhoneNumber>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberPhoneByCountryCallingCodeAndPhoneNumber(
    countryCallingCode: string,
    phoneNumber: string,
  ): Promise<ResponseEntity<typeof memberPhone.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(memberPhone)
        .where(
          and(
            eq(memberPhone.countryCallingCode, countryCallingCode),
            eq(memberPhone.phoneNumber, phoneNumber),
          ),
        );
      if (result.length > 1) {
        throw new Error(
          'The data searched by memberPhone.countryCallingCode and memberPhone.phoneNumber is duplicated.',
        );
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof memberPhone.$inferSelect>(false);
      }
      return new ResponseEntity<typeof memberPhone.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
