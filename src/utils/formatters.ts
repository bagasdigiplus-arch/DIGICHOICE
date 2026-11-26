export function formatRupiah(amount: number): string {
  if (!Number.isFinite(amount)) return "Rp 0";
  const rounded = Math.round(amount);
  return "Rp " + rounded.toLocaleString("id-ID");
}

export function calcMonthlyInstallment(
  principal: number,
  months: number,
  monthlyInterestPct = 0,
  adminFee = 0
): number {
  if (principal <= 0 || months <= 0) return 0;
  const totalWithInterest = principal * (1 + (monthlyInterestPct / 100) * months) + adminFee;
  return Math.round(totalWithInterest / months);
}
