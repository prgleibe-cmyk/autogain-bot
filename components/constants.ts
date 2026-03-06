
import { SystemSettings, RiskMode, AssetSelectionMode, OptionType } from './types';
import { STRATEGIES_REPOSITORY } from './data/strategies';

// Global database of default assets for fallback
export const GLOBAL_ASSETS_DATABASE: string[] = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'EURJPY', 'GBPUSD-OTC', 'EURUSD-OTC'
];

export const ASSETS_OPEN_DEFAULT: string[] = [];
export const ASSETS_OTC_DEFAULT: string[] = [];

export const HUNT_DURATION = 15 * 60 * 1000;
export const WAIT_DURATION = 30 * 60 * 1000;
export const HIBERNATE_DURATION = 4 * 60 * 60 * 1000;

export { STRATEGIES_REPOSITORY };

const initialEnabledStrategies = STRATEGIES_REPOSITORY.reduce((acc, strat) => {
  acc[strat.id] = strat.id !== 'TEST_HIGH_FREQ';
  return acc;
}, {} as Record<string, boolean>);

const initialStats = STRATEGIES_REPOSITORY.reduce((acc, strat) => {
  acc[strat.id] = { wins: 0, losses: 0, profit: 0 };
  return acc;
}, {} as Record<string, any>);

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  riskMode: RiskMode.FIXED,
  mode: 'single',
  entryManagementMode: 'GLOBAL', 
  strategyCustomConfigs: {}, 
  entryType: 'FIXED',
  entryPercent: 1.0,
  entryFixedValue: 2.0,
  stopType: 'PERCENT',
  stopWinPercent: 5.0,
  stopLossPercent: 10.0,
  stopWinValue: 100.0,
  stopLossValue: 50.0,
  stopWinCount: 3,
  stopLossCount: 2,
  useScoreStop: false,
  ciclo310Mode: 'FIXED',
  ciclo310FixedValue: 2.00,
  sorosLevels: 3,
  masanieloFactor: 1.4,
  maxMartingaleLevels: 2,
  martingaleMultiplier: 2.2,
  minPayout: 80,
  minConfidence: 85,
  shutdownRule: 'TARGET_ONLY', 
  huntDuration: 15,
  waitDuration: 30,
  hibernateDuration: 240,
  maintenanceMode: false,
  trialDays: 0,
  commissionEnabled: true,
  commissionRate: 10,
  growthThresholdPercent: 10,
  pixKey: '',
  whatsapp: '',
  enabledStrategies: initialEnabledStrategies,
  strategyStats: initialStats,
  stealthMode: true,
  humanDelayMax: 600,
  maxSlippage: 0.00005,
  activeAssetsOpen: [], 
  activeAssetsOTC: [],  
  tradingMarketMode: 'BOTH',
  assetSelectionMode: AssetSelectionMode.AUTO_PAYOUT,
  allowedOptionTypes: [OptionType.BINARY],
  maxConcurrentTrades: 1, 
  dailyGoalConfig: {
    enabled: true,
    type: 'VALUE',
    goalValue: 100.00,
    goalPercent: 10.0,
    returnTime: '08:00',
    lastGoalHitDate: null
  },
  timezoneRules: [],
  marketFilters: {
    autoCalibration: true,
    timeFilter: true,      
    dojiFilter: true,       
    wickFilter: true,      
    directionFilter: true, 
    contextFilter: true,    
    maxDojiCount: 3,        
    minWickPercent: 10,      
    minRangeSize: 0.00010   
  }
};
