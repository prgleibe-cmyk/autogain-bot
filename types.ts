
export enum Broker {
  IQ_OPTION = 'IQ Option',
  QUOTEX = 'Quotex'
}

export enum MarketType {
  OPEN = 'MERCADO ABERTO',
  OTC = 'MERCADO OTC',
  BOTH = 'AMBOS'
}

export enum BotStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  TRADING = 'TRADING',
  PAUSED_RISK = 'PAUSED_RISK',
  WAITING_OPPORTUNITY = 'WAITING_OPPORTUNITY',
  HIBERNATING = 'HIBERNATING',
  STOPPED_LOSS = 'STOPPED_LOSS',
  STOPPED_ERROR = 'STOPPED_ERROR'
}

export enum TradeResult {
  WIN = 'WIN',
  LOSS = 'LOSS',
  PENDING = 'PENDING',
  ERROR = 'ERROR'
}

export enum OptionType {
  BINARY = 'BINARY',
  DIGITAL = 'DIGITAL'
}

export enum RiskMode {
  FIXED = 'FIXED',
  MARTINGALE = 'MARTINGALE',
  SOROS = 'SOROS',
  SOROS_GALE = 'SOROS_GALE',
  MASANIELO = 'MASANIELO',
  CICLO_3_10 = 'CICLO_3_10'
}

export enum AssetSelectionMode {
  AUTO_PAYOUT = 'AUTO_PAYOUT',
  MANUAL = 'MANUAL'
}

export interface MarketCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Trade {
  id: string;
  timestamp: number;
  finishedAt?: number;
  asset: string;
  direction: 'CALL' | 'PUT';
  amount: number;
  entryPrice: number;
  payout: number;
  result: TradeResult;
  profit: number;
  optionType: OptionType;
  strategyUsed: string;
  strategyName: string;
}

export interface Wallet {
  balance: number;
  initialBalance: number;
  currency: string;
  accountType: 'REAL' | 'DEMO';
}

export interface DailyGoalConfig {
  enabled: boolean;
  type: 'VALUE' | 'PERCENT';
  goalValue: number;
  goalPercent: number;
  returnTime: string;
  lastGoalHitDate: string | null;
}

export interface MarketFilterSettings {
  autoCalibration: boolean;
  timeFilter: boolean;
  dojiFilter: boolean;
  wickFilter: boolean;
  directionFilter: boolean;
  contextFilter: boolean;
  maxDojiCount: number;
  minWickPercent: number;
  minRangeSize: number;
}

export interface SystemSettings {
  riskMode: RiskMode;
  mode: 'single' | 'multi';
  entryManagementMode: 'GLOBAL' | 'STRATEGY';
  strategyCustomConfigs: Record<string, any>;
  entryType: 'PERCENT' | 'FIXED';
  entryPercent: number;
  entryFixedValue: number;
  stopType: 'PERCENT' | 'VALUE' | 'SCORE';
  stopWinPercent: number;
  stopLossPercent: number;
  stopWinValue: number;
  stopLossValue: number;
  stopWinCount: number;
  stopLossCount: number;
  useScoreStop: boolean;
  ciclo310Mode: 'PERCENT' | 'FIXED';
  ciclo310FixedValue: number;
  sorosLevels: number;
  masanieloFactor: number;
  maxMartingaleLevels: number;
  martingaleMultiplier: number;
  minPayout: number;
  minConfidence: number;
  shutdownRule: 'TIMER_OR_TARGET' | 'TARGET_ONLY';
  huntDuration: number;
  waitDuration: number;
  hibernateDuration: number;
  maintenanceMode: boolean;
  trialDays: number;
  commissionEnabled: boolean;
  commissionRate: number;
  growthThresholdPercent: number;
  pixKey: string;
  whatsapp: string;
  enabledStrategies: Record<string, boolean>;
  strategyStats: Record<string, any>;
  stealthMode: boolean;
  humanDelayMax: number;
  maxSlippage: number;
  activeAssetsOpen: string[];
  activeAssetsOTC: string[];
  tradingMarketMode: 'OPEN' | 'OTC' | 'BOTH';
  assetSelectionMode: AssetSelectionMode;
  allowedOptionTypes: OptionType[];
  maxConcurrentTrades: number;
  dailyGoalConfig: DailyGoalConfig;
  timezoneRules: TimezoneRule[];
  marketFilters: MarketFilterSettings;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'BLOCKED' | 'TRIAL' | 'PAYMENT_PENDING';
  daysRemaining: number;
  profitShareDue: number;
  joinedAt: number;
  isBotRunning: boolean;
  customCommissionRate?: number;
  isExempt?: boolean;
}

export type SubscriptionStatus = 'ACTIVE' | 'WARNING' | 'BLOCKED' | 'TRIAL';

export interface Invoice {
  id: string;
  amount: number;
  profitReference: number;
  growthReference: number;
  status: 'PENDING' | 'PAID';
  pixCode: string;
  pixQrImage: string;
  createdAt: number;
  dueDate?: number;
}

export interface FinanceState {
  netProfit: number;
  commissionDue: number;
  highWaterMark: number;
  lastSettlementDate: number;
  invoices: Invoice[];
  status: SubscriptionStatus;
}

export interface AnalysisResult {
  direction: 'CALL' | 'PUT' | 'HOLD';
  confidence: number;
  reason: string;
  strategyId: string;
  strategyName: string;
}

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  marketType: 'OPEN' | 'OTC' | 'BOTH';
  timeframe: 'M1' | 'M5';
  bypassGlobalFilters?: boolean;
}

export interface StrategyPerformance {
  wins: number;
  losses: number;
  profit: number;
}

export type MarketSnapshot = Record<string, MarketCandle[]>;

export interface AuditLog {
  timestamp: number;
  action: string;
  details: string;
  user: string;
}

export interface StrategyCustomConfig {
  entryType: 'PERCENT' | 'FIXED';
  entryValue: number;
}

export type MarketDataMap = Record<string, MarketCandle[]>;

export interface StrategyConfig {
  amount: number;
  payout: number;
  stopWin: number;
  stopLoss: number;
  martingaleMultiplier: number;
  useMartingale: boolean;
  maxMartingaleLevels: number;
  useSoros: boolean;
  marketType: MarketType;
}

export interface Signal {
  asset: string;
  direction: 'CALL' | 'PUT';
  confidence: number;
  reason: string;
  strategyId: string;
  strategyName: string;
  score?: number;
}

export interface TimezoneRule {
  color: TimezoneColor;
  label: string;
  priority: number;
  active: boolean;
  blockMinutesBefore: number;
  blockMinutesAfter: number;
}

export type TimezoneColor = 'BLUE' | 'GREEN' | 'YELLOW' | 'WINE' | 'RED' | 'BLACK';
