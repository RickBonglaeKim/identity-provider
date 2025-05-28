import {
  member,
  memberDetail,
} from 'libs/persistence/database-schema/main/schema';

type verifyMemberByEmailType = {
  memberId: typeof member.$inferSelect.id;
  memberDetailId: typeof memberDetail.$inferSelect.id;
  password: typeof memberDetail.$inferSelect.password;
};
export type verifyMemberByEmail = Required<verifyMemberByEmailType>;

export type verifyMemberByEmailAndPassword = Omit<
  verifyMemberByEmailType,
  'password'
>;

export type verifyMemberByPassword = Omit<verifyMemberByEmailType, 'password'>;

export type verifyMemberByMemberProviderKey = Omit<
  verifyMemberByEmailType,
  'password'
>;
