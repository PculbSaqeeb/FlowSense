export const ACTION_CONFIG: Record<string, { color: string; bgColor: string }> = {
  A001: { color: 'text-green-400', bgColor: 'bg-green-500/10' },
  A002: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  A003: { color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  A004: { color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  A005: { color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  A006: { color: 'text-red-400', bgColor: 'bg-red-500/10' },
};

export const CHART_CONFIG = {
  gridStroke: 'rgba(255,255,255,0.1)',
  axisStroke: 'rgba(255,255,255,0.5)',
  tickStyle: { fill: 'rgba(255,255,255,0.5)', fontSize: 12 },
  tooltipStyle: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
  },
  labelStyle: { color: 'rgba(255,255,255,0.7)' },
  crisisLineY: 15,
  gradientStart: '#6366f1',
  gradientEnd: '#6366f1',
  yDomain: [0, 25] as [number, number],
} as const;