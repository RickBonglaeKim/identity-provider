import {
  memberDetail,
  memberPhone,
} from 'libs/persistence/database-schema/main/schema';

type selectMemberPhoneByCountryCallingCodeAndPhoneNumberType = {
  countryCallingCode: typeof memberPhone.$inferSelect.countryCallingCode;
  phoneNumber: typeof memberPhone.$inferSelect.phoneNumber;
};
export type selectMemberPhoneByCountryCallingCodeAndPhoneNumber =
  Required<selectMemberPhoneByCountryCallingCodeAndPhoneNumberType>;

type selectMemberDetailByEmailType = {
  email: typeof memberDetail.$inferSelect.email;
};
export type selectMemberDetailByEmail = Required<selectMemberDetailByEmailType>;
