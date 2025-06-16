import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import {
  member,
  memberDetail,
  provider,
} from 'libs/persistence/database-schema/main/schema';
import { and, eq } from 'drizzle-orm';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { SelectMemberAndMemberDetailAndProviderByMemberDetailId } from '@app/persistence/entity/member.entity';

@Injectable()
export class MemberEntireRepository extends MainSchemaService {
  private readonly logger = new Logger(MemberEntireRepository.name);

  async selectMemberAndMemberDetailAndProviderByMemberDetailId(
    memberDetailId: number,
  ): Promise<
    | ResponseEntity<SelectMemberAndMemberDetailAndProviderByMemberDetailId>
    | undefined
  > {
    try {
      const result = await this.mainTransaction.tx
        .select({
          createdAt: member.createdAt,
          isConsentedArtBonbonTermsAndConditions:
            member.isConsentedArtBonbonTermsAndConditions,
          isConsentedILandTermsAndConditions:
            member.isConsentedILandTermsAndConditions,
          isConsentedGalleryBonbonTermsAndConditions:
            member.isConsentedGalleryBonbonTermsAndConditions,
          isConsentedCollectionAndUsePersonalData:
            member.isConsentedCollectionAndUsePersonalData,
          isConsentedUseAiSketchService: member.isConsentedUseAiSketchService,
          isConsentedOver14Years: member.isConsentedOver14Years,
          isConsentedEventAndInformationReceiving:
            member.isConsentedEventAndInformationReceiving,
          name: memberDetail.name,
          email: memberDetail.email,
          provider: provider.name,
        })
        .from(memberDetail)
        .innerJoin(member, eq(memberDetail.memberId, member.id))
        .innerJoin(provider, eq(memberDetail.providerId, provider.id))
        .where(eq(memberDetail.id, memberDetailId));
      if (result.length > 1) {
        throw new Error('The data searched by memberDetail.id is duplicated.');
      }
      if (result.length === 0) {
        return new ResponseEntity<SelectMemberAndMemberDetailAndProviderByMemberDetailId>(
          false,
        );
      }
      return new ResponseEntity<SelectMemberAndMemberDetailAndProviderByMemberDetailId>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
