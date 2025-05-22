export type SignMember =
  | {
      memberId: number;
      memberDetailId: number;
    }
  | undefined;

export type CookieValue = SignMember & {
  timestamp: number;
};

export type MemberKey = SignMember & {
  passportKey: string;
  timestamp: number;
};
