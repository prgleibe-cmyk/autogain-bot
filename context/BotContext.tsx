
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { BotStatus, Trade, Wallet, MarketCandle, Broker, StrategyConfig, SubscriptionStatus, Invoice, SystemSettings, TradeResult, MarketDataMap } from '../types';
import { useBroker } from '../hooks/useBroker';
import { useMarketData } from '../hooks/useMarketData';
import { useBotEngine } from '../hooks/useBotEngine';
import { useSubscription } from '../hooks/useSubscription';
import { IntegrityGuard } from '../services/integrityGuard';
import { useBotAssets } from '../hooks/useBotAssets';
import { HiveMind } from '../services/hive';

interface BotContextData {
  toasts: any[];
  addToast: (type: 'success' | 'error' | 'info', title: string, message: string, amount?: string) => void;
  removeToast: (id: string) => void;
  isConnectModalOpen: boolean;
  setIsConnectModalOpen: (open: boolean) => void;
  broker: Broker;
  setBroker: (b: Broker) => void;
  isBrokerConnected: boolean;
  wallet: Wallet;
  setWallet: React.Dispatch<React.SetStateAction<Wallet>>;
  connectBroker: (initialBalance: number, accountType: 'REAL' | 'DEMO') => void;
  disconnectBroker: () => void;
  switchAccount: () => void;
  status: BotStatus;
  toggleBot: () => void;
  resetSession: () => void;
  trades: Trade[];
  lastAnalysis: string;
  aiConfidence: number;
  currentAsset: string;
  config: StrategyConfig;
  setConfig: React.Dispatch<React.SetStateAction<StrategyConfig>>;
  activeAssetCount: number;
  lastStrategyDetected: string;
  currentCycleStep: number;
  currentEntryAmount: number;
  consecutiveLosses: number;
  hourlyWinRate: number | null;
  currentHour: number;
  wakeUpTime: number | null;
  totalProfit: number;
  activeTrades: Trade[];
  historyTrades: Trade[];
  marketData: MarketCandle[]; 
  allMarketData?: MarketDataMap; 
  currentPrice: number;
  subscriptionStatus: SubscriptionStatus;
  pendingInvoice: Invoice | undefined;
  currentProfitCycle: number;
  accumulatedCommission: number;
  showPaymentModal: boolean;
  setShowPaymentModal: (show: boolean) => void;
  handlePaymentConfirmed: () => Promise<boolean>;
  systemSettings: SystemSettings;
  userEmail: string;
  availableAssets: string[];
  source: string;
  refreshFinancialState: () => void;
}

const BotContext = createContext<BotContextData>({} as BotContextData);

export const BotProvider: React.FC<{ 
  children: ReactNode; 
  userEmail: string; 
  isAuthenticated: boolean;
  systemSettings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
}> = ({ children, userEmail, isAuthenticated, systemSettings, onUpdateSettings }) => {
  
  const [toasts, setToasts] = useState<any[]>([]);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [config, setConfig] = useState<StrategyConfig>({} as StrategyConfig);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, message: string, amount?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, title, message, amount }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const { marketData, allMarketData, currentPrice } = useMarketData();
  const [status, setStatusState] = useState<BotStatus>(BotStatus.IDLE); 
  const [lastAnalysis, setLastAnalysisState] = useState('Aguardando conexão...');

  const brokerHook = useBroker({
    setStatus: setStatusState,
    setLastAnalysis: setLastAnalysisState,
    addToast
  });

  const { activeAssets, source } = useBotAssets(brokerHook.isBrokerConnected, systemSettings);

  const subscriptionHook = useSubscription(
    isAuthenticated, 
    userEmail, 
    brokerHook.disconnectBroker,
    systemSettings,
    brokerHook.wallet
  );

  const botEngine = useBotEngine({
    wallet: brokerHook.wallet,
    setWallet: brokerHook.setWallet,
    setRealBalance: brokerHook.setRealBalance,
    setDemoBalance: brokerHook.setDemoBalance,
    systemSettings,
    onUpdateSettings,
    isBrokerConnected: brokerHook.isBrokerConnected,
    marketData,
    allMarketData,
    currentPrice,
    broker: brokerHook.broker,
    addToast,
    refreshFinancialState: subscriptionHook.refreshFinancialState, 
    userEmail, 
    isAuthenticated,
    activeAssets
  });

  useEffect(() => {
    const hive = HiveMind.getInstance();
    hive.configure(systemSettings.marketFilters, systemSettings.enabledStrategies);
  }, [systemSettings]);

  const safeToggleBot = useCallback(async () => {
      if (botEngine.status === BotStatus.IDLE) {
          await subscriptionHook.refreshFinancialState(true);
      }

      const integrity = IntegrityGuard.validateState(
          botEngine.status === BotStatus.IDLE ? BotStatus.ANALYZING : BotStatus.IDLE, 
          systemSettings, 
          brokerHook.wallet,
          subscriptionHook.subscriptionStatus,
          totalProfit,
          botEngine.sessionInitialBalance
      );

      if (botEngine.status === BotStatus.IDLE && !integrity.valid) {
          if (integrity.isFinancial) {
              subscriptionHook.setShowPaymentModal(true);
          } else {
              addToast('error', 'BLOQUEIO DE SEGURANÇA', integrity.reason || 'Falha de integridade');
          }
          return;
      }
      botEngine.toggleBot();
  }, [botEngine.status, systemSettings, brokerHook.wallet, subscriptionHook.subscriptionStatus, subscriptionHook.refreshFinancialState, subscriptionHook.setShowPaymentModal, addToast, botEngine]);

  const totalProfit = useMemo(() => {
      return botEngine.trades.reduce((acc, trade) => {
          if (trade.result === TradeResult.WIN) return acc + (Number(trade.profit) || 0);
          if (trade.result === TradeResult.LOSS || trade.result === TradeResult.ERROR) return acc - (Number(trade.amount) || 0);
          return acc;
      }, 0);
  }, [botEngine.trades]);

  const activeTrades = useMemo(() => {
    return botEngine.trades.filter(t => 
        (t.result === TradeResult.PENDING || (t.finishedAt && Date.now() - t.finishedAt < 4000)) &&
        t.result !== TradeResult.ERROR
    );
  }, [botEngine.trades]);

  const historyTrades = useMemo(() => {
    return botEngine.trades.filter(t => t.result === TradeResult.WIN || t.result === TradeResult.LOSS);
  }, [botEngine.trades]);

  // CRITICAL: Memoize the context value to prevent unnecessary re-renders of the whole app on every price tick
  const contextValue = useMemo(() => ({
    toasts, addToast, removeToast,
    isConnectModalOpen, setIsConnectModalOpen,
    ...brokerHook,
    status: botEngine.status,
    toggleBot: safeToggleBot,
    resetSession: botEngine.resetSession,
    trades: botEngine.trades,
    lastAnalysis: botEngine.lastAnalysis,
    aiConfidence: botEngine.aiConfidence,
    currentAsset: botEngine.currentAsset,
    config: config,
    setConfig: setConfig,
    activeAssetCount: botEngine.activeAssetCount,
    lastStrategyDetected: botEngine.lastStrategyDetected,
    currentCycleStep: botEngine.currentCycleStep,
    currentEntryAmount: botEngine.currentEntryAmount,
    consecutiveLosses: botEngine.consecutiveLosses,
    hourlyWinRate: null,
    currentHour: new Date().getHours(),
    wakeUpTime: botEngine.wakeUpTime,
    totalProfit,
    activeTrades,
    historyTrades,
    marketData,
    allMarketData,
    currentPrice,
    ...subscriptionHook,
    systemSettings,
    userEmail,
    availableAssets: activeAssets,
    source
  }), [
    toasts, addToast, removeToast, isConnectModalOpen, brokerHook,
    botEngine.status, safeToggleBot, botEngine.resetSession, botEngine.trades,
    botEngine.lastAnalysis, botEngine.aiConfidence, botEngine.currentAsset,
    // FIXED: activeAssetCount was undefined in this scope, now correctly referencing botEngine.activeAssetCount
    config, botEngine.activeAssetCount, botEngine.lastStrategyDetected, botEngine.currentCycleStep,
    botEngine.currentEntryAmount, botEngine.consecutiveLosses, botEngine.wakeUpTime,
    totalProfit, activeTrades, historyTrades, marketData, allMarketData, currentPrice,
    subscriptionHook, systemSettings, userEmail, activeAssets, source
  ]);

  return (
    <BotContext.Provider value={contextValue}>
      {children}
    </BotContext.Provider>
  );
};

export const useBotContext = () => useContext(BotContext);
