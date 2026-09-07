// No server-only imports here — the Balance tab's client-side optimistic
// update needs this same identity check, so it must stay safe for the
// browser bundle (see settlement.ts, which has the prisma-dependent half).

export interface TransferIdentity {
  fromMembershipId: string;
  toMembershipId: string;
  amount: number;
}

/** A transfer's identity for matching a freshly computed suggestion against
 * a persisted settle record: same trip + same debtor + same creditor + same
 * amount counts as "the same transfer," regardless of when either is
 * (re)computed. */
export function transferKey({ fromMembershipId, toMembershipId, amount }: TransferIdentity): string {
  return `${fromMembershipId}:${toMembershipId}:${amount}`;
}
