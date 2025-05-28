import {
  member,
  memberDetail,
  memberPhone,
  provider,
} from 'libs/persistence/database-schema/main/schema';

type selectMemberPhoneByDistinctCountryCallingCodeAndPhoneNumberType = {
  countryCallingCode: typeof memberPhone.$inferSelect.countryCallingCode;
  phoneNumber: typeof memberPhone.$inferSelect.phoneNumber;
};
export type selectMemberPhoneByDistinctCountryCallingCodeAndPhoneNumber =
  Required<selectMemberPhoneByDistinctCountryCallingCodeAndPhoneNumberType>;

type SelectMemberDetailByDistinctEmailType = {
  email: typeof memberDetail.$inferSelect.email;
};
export type SelectMemberDetailByDistinctEmail =
  Required<SelectMemberDetailByDistinctEmailType>;

type SelectMemberAndMemberDetailAndProviderByMemberDetailIdType = {
  createdAt: typeof member.$inferSelect.createdAt;
  isConsentedTermsAndConditions: typeof member.$inferSelect.isConsentedTermsAndConditions;
  isConsentedCollectionAndUsePersonalData: typeof member.$inferSelect.isConsentedCollectionAndUsePersonalData;
  isConsentedMarketingUseAndInformationReceiving: typeof member.$inferSelect.isConsentedMarketingUseAndInformationReceiving;
  name: typeof memberDetail.$inferSelect.name;
  email: typeof memberDetail.$inferSelect.email;
  provider: typeof provider.$inferSelect.name;
};
export type SelectMemberAndMemberDetailAndProviderByMemberDetailId =
  Required<SelectMemberAndMemberDetailAndProviderByMemberDetailIdType>;
