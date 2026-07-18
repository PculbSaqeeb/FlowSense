export const TRIAGE_CONFIG: Record<number, { color: string; label: string }> = {
  1: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'CRITICAL' },
  2: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'EMERGENT' },
  3: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'URGENT' },
  4: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'LESS URGENT' },
  5: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'NON URGENT' },
};

export const PATIENT_STATUS_COLORS: Record<string, string> = {
  waiting: 'text-yellow-400',
  in_treatment: 'text-blue-400',
  admitted: 'text-purple-400',
};