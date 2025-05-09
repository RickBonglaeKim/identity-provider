import { memberDetail } from 'libs/persistence/database-schema/main/schema';

type selectMemberDetailByEmailAndPasswordType = {
  memberDetail: typeof memberDetail.$inferSelect;
  provider: { key: string; name: string } | null;
};
export type selectMemberDetailByEmailAndPassword =
  Required<selectMemberDetailByEmailAndPasswordType>;
