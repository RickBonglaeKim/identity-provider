export type SignMember =
  | {
      memberId: number;
      memberDetailId: number;
    }
  | undefined;

export type CookieValue = SignMember & {
  timestamp: number;
};
