import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import {
  member,
  memberDetail,
} from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { and, eq } from 'drizzle-orm';
import {
  verifyMemberByEmail,
  verifyMemberByEmailAndPassword,
  verifyMemberByMemberProviderKey,
  verifyMemberByPassword,
} from '@app/persistence/entity/sign.entity';
import { Providers } from 'dto/enum/provider.enum';

@Injectable()
export class SignRepository extends MainSchemaService {
  private readonly logger = new Logger(SignRepository.name);

  async verifyMemberByEmail(
    email: string,
    providerId: Providers,
  ): Promise<ResponseEntity<verifyMemberByEmail[]> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select({
          memberId: member.id,
          memberDetailId: memberDetail.id,
          password: memberDetail.password,
        })
        .from(memberDetail)
        .innerJoin(member, eq(member.id, memberDetail.memberId))
        .where(
          and(
            eq(memberDetail.email, email),
            eq(memberDetail.providerId, providerId),
          ),
        );
      if (result.length === 0) {
        return new ResponseEntity<verifyMemberByEmail[]>(false);
      }
      return new ResponseEntity<verifyMemberByEmail[]>(true, result);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async verifyMemberByEmailAndPassword(
    email: string,
    password: string,
  ): Promise<ResponseEntity<verifyMemberByEmailAndPassword> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select({
          memberId: member.id,
          memberDetailId: memberDetail.id,
        })
        .from(memberDetail)
        .innerJoin(member, eq(member.id, memberDetail.memberId))
        .where(
          and(
            eq(memberDetail.email, email),
            eq(memberDetail.password, password),
          ),
        );
      if (result.length === 0) {
        return new ResponseEntity<verifyMemberByEmailAndPassword>(false);
      }
      return new ResponseEntity<verifyMemberByEmailAndPassword>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async verifyMemberByPassword(
    password: string,
  ): Promise<ResponseEntity<verifyMemberByPassword> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select({
          memberId: member.id,
          memberDetailId: memberDetail.id,
        })
        .from(memberDetail)
        .innerJoin(member, eq(member.id, memberDetail.memberId))
        .where(and(eq(memberDetail.password, password)));
      if (result.length === 0) {
        return new ResponseEntity<verifyMemberByPassword>(false);
      }
      return new ResponseEntity<verifyMemberByPassword>(true, result[0]);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async verifyMemberByMemberProviderKey(
    memberProviderKey: string,
  ): Promise<ResponseEntity<verifyMemberByMemberProviderKey> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select({
          memberId: member.id,
          memberDetailId: memberDetail.id,
        })
        .from(memberDetail)
        .innerJoin(member, eq(member.id, memberDetail.memberId))
        .where(and(eq(memberDetail.memberProviderKey, memberProviderKey)));
      if (result.length === 0) {
        return new ResponseEntity<verifyMemberByMemberProviderKey>(false);
      }
      return new ResponseEntity<verifyMemberByMemberProviderKey>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
