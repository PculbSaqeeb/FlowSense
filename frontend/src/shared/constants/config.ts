export const APP_CONFIG = {
  name: 'FlowSense',
  description: 'Hospital Flow Intelligence',
  refreshInterval: 60_000, // ms (1 minute)
  maxAlerts: 10,
  criticalTimeThreshold: 120, // minutes
  crisisBoardingThreshold: 15,
  revenuePerBoarding: 5_000,
  dataSource: {
    name: 'MIMIC-IV-ED / Texas DSHS ED',
    records: 143_280,
    period: '2017-2019',
    source: 'PhysioNet / Texas DSHS',
    note: 'Trained on real ED visit data',
  },
} as const;