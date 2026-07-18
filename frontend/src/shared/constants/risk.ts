export function getRiskLevel(boarding: number): 'low' | 'medium' | 'high' | 'critical' {
  if (boarding >= 18) return 'critical';
  if (boarding >= 14) return 'high';
  if (boarding >= 10) return 'medium';
  return 'low';
}