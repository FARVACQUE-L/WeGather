import type { MemberSpending } from "@/types/dashboard";

// Solde d'un membre : ce qu'il a payé moins sa part des dépenses du groupe
// (même calcul que le tableau de bord du site).
export const getMyBalance = (spendings: MemberSpending[], userId: number) => {
  if (spendings.length === 0) return 0;

  const total = spendings.reduce(
    (sum, row) => sum + Number(row.total_price),
    0,
  );
  const mine = spendings.find((row) => row.user_id === userId);
  const balance = Number(mine?.total_price ?? 0) - total / spendings.length;

  return Math.round(balance * 100) / 100;
};

export const formatBalance = (balance: number) => {
  const amount = Math.abs(balance).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (balance > 0) return `+${amount} €`;
  if (balance < 0) return `-${amount} €`;
  return "0 €";
};
