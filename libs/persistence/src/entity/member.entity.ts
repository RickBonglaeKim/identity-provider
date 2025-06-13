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

type selectMemberVerificationByNameAndCountryCallingCodeAndPhoneNumberType = {
  memberId: typeof member.$inferSelect.id;
  memberDetailId: typeof memberDetail.$inferSelect.id;
  memberPhoneId: typeof memberPhone.$inferSelect.id;
  email: typeof memberDetail.$inferSelect.email;
};
export type selectMemberVerificationByNameAndCountryCallingCodeAndPhoneNumber =
  Required<selectMemberVerificationByNameAndCountryCallingCodeAndPhoneNumberType>;

type selectMemberVerificationByEmailAndCountryCallingCodeAndPhoneNumberType = {
  memberId: typeof member.$inferSelect.id;
  memberDetailId: typeof memberDetail.$inferSelect.id;
  memberPhoneId: typeof memberPhone.$inferSelect.id;
  providerId: typeof memberDetail.$inferSelect.providerId;
};
export type selectMemberVerificationByEmailAndCountryCallingCodeAndPhoneNumber =
  Required<selectMemberVerificationByEmailAndCountryCallingCodeAndPhoneNumberType>;
