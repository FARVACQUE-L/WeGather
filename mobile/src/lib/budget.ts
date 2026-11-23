import type { MemberSpending } from "@/types/dashboard";

const round = (value: number) => Math.round(value * 100) / 100;

// Solde d'un membre : ce qu'il a payé moins sa part des dépenses du groupe
// (même calcul que le budget du site). Positif : on lui doit de l'argent.
export type MemberBalance = {
  user_id: number;
  user_username: string;
  balance: number;
};

export const getBalances = (spendings: MemberSpending[]): MemberBalance[] => {
  if (spendings.length === 0) return [];

  const total = spendings.reduce(
    (sum, row) => sum + Number(row.total_price),
    0,
  );
  const share = total / spendings.length;

  return spendings.map((row) => ({
    user_id: row.user_id,
    user_username: row.user_username,
    balance: round(Number(row.total_price) - share),
  }));
};

export const getMyBalance = (spendings: MemberSpending[], userId: number) =>
  getBalances(spendings).find((row) => row.user_id === userId)?.balance ?? 0;

// Remboursements pour équilibrer les comptes, comme sur le site : les plus
// gros débiteurs remboursent d'abord les plus gros créanciers.
export type Settlement = {
  from: MemberBalance;
  to: MemberBalance;
  amount: number;
};

export const getSettlements = (balances: MemberBalance[]): Settlement[] => {
  const debtors = balances
    .filter((row) => row.balance < 0)
    .map((row) => ({ member: row, rest: -row.balance }))
    .sort((a, b) => b.rest - a.rest);
  const creditors = balances
    .filter((row) => row.balance > 0)
    .map((row) => ({ member: row, rest: row.balance }))
    .sort((a, b) => b.rest - a.rest);

  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.rest, creditor.rest);

    if (round(amount) > 0) {
      settlements.push({
        from: debtor.member,
        to: creditor.member,
        amount: round(amount),
      });
    }

    debtor.rest -= amount;
    creditor.rest -= amount;
    if (debtor.rest < 0.01) debtorIndex++;
    if (creditor.rest < 0.01) creditorIndex++;
  }

  return settlements;
};

// "42 €", "42,50 €" (les centimes seulement s'il y en a).
export const formatPrice = (value: number | string) => {
  const amount = round(Math.abs(Number(value)));
  const decimals = Number.isInteger(amount) ? 0 : 2;

  return `${amount.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} €`;
};

// "+12 €", "-8,50 €" ou "0 €".
export const formatBalance = (balance: number) => {
  if (balance > 0) return `+${formatPrice(balance)}`;
  if (balance < 0) return `-${formatPrice(balance)}`;
  return "0 €";
};
