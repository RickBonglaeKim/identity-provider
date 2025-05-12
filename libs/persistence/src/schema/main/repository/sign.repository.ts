import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import {
  member,
  memberDetail,
  provider,
} from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { and, eq } from 'drizzle-orm';
import { verifyMemberByEmailAndPassword } from '@app/persistence/entity/sign.entity';

@Injectable()
export class SignRepository extends MainSchemaService {
  private readonly logger = new Logger(SignRepository.name);

  async verifyMemberByEmail(
    email: string,
  ): Promise<ResponseEntity<verifyMemberByEmailAndPassword[]> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select({
          memberId: member.id,
          memberDetailId: memberDetail.id,
          password: memberDetail.password,
        })
        .from(memberDetail)
        .innerJoin(member, eq(member.id, memberDetail.memberId))
        .where(and(eq(memberDetail.email, email)));
      if (result.length === 0) {
        return new ResponseEntity<verifyMemberByEmailAndPassword[]>(false);
      }
      return new ResponseEntity<verifyMemberByEmailAndPassword[]>(true, result);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
