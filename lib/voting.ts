export function calculateVotingUnits(capitalContribution: number): number {
  const P_MAX = Number(process.env.NEXT_PUBLIC_VOTING_P_MAX) || 1000;
  const P_MIN = Number(process.env.NEXT_PUBLIC_VOTING_P_MIN) || 1;
  const LEVERAGE = Number(process.env.NEXT_PUBLIC_VOTING_LEVERAGE) || 5;
  const ALPHA = Number(process.env.NEXT_PUBLIC_VOTING_ALPHA) || 0.23299;

  if (capitalContribution < P_MIN) return 0;
  if (capitalContribution >= P_MAX) return LEVERAGE;

  return LEVERAGE * Math.pow(capitalContribution / P_MAX, ALPHA);
}
