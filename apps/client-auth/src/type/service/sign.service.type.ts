export type SignMember = {
  memberId: number;
  memberDetailId: number;
};

export type SignCookie = SignMember & {
  timestamp: number;
};

export type MemberKey = SignMember & {
  passportKey: string;
  timestamp: number;
};
