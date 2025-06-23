import { Providers } from 'dto/enum/provider.enum';

export type SignMember = {
  memberId: number;
  memberDetailId: number;
};

export type SignMemberPhone = SignMember & {
  memberPhoneId: number;
};

export type SignCookie = SignMember & {
  timestamp: number;
};

export type SignToken = SignMember & {
  timestamp: number;
  nonce: string;
};

export type MemberKey = SignMember & {
  passportKey: string;
  timestamp: number;
};
