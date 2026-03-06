import React, { useRef, useCallback, useEffect } from 'react';
import { Trade, TradeResult, OptionType, Wallet, BotStatus, SystemSettings, RiskMode } from '../types';
import { bridgeApi } from '../services/bridgeApi';
import { RiskEngine } from '../services/risk/RiskEngine';
import { financeManager } from '../services/financeManager';
import { statsManager } from '../services/statsManager';
import { getSessionStats } from './useBotEngine';

interface UseTradeExecutorParams {
  wallet: Wallet;
  setWallet: React.Dispatch<React.SetStateAction<Wallet>>;
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  tradesRef: React.MutableRefObject<Trade[]>;
  sessionStats: any;
  sessionInitialBalance: number;
  addToast: (type: any, title: string, message: string, amount?: string) => void;
  isBrokerConnected: boolean;
  statusRef: React.MutableRefObject<BotStatus>;
  latestPriceRef: React.MutableRefObject<number>;
  refreshFinancialState: () => void;
  userEmail: string;
}

export const useTradeExecutor = ({
  wallet, setWallet, setTrades, tradesRef, sessionInitialBalance,
  addToast, isBrokerConnected, latestPriceRef,
  refreshFinancialState, userEmail
}: UseTradeExecutorParams) => {

  const processingAssets = useRef<Set<string>>(new Set());
  const openTradesCountRef = useRef<number>(0);
  const walletRef = useRef<Wallet>(wallet);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const executeOrder = useCallback(async (
    direction: 'CALL' | 'PUT',
    strategyId: string,
    strategyName: string,
    assetName: string,
    currentWallet: Wallet,
    settings: SystemSettings, // ← IMPORTANTE
    currentPriceSnapshot: number
  ) => {
    if (!isBrokerConnected) return;

    // 1️⃣ VALIDAÇÃO DE CONCORRÊNCIA E ESTADO PENDENTE
    // Se maxConcurrentTrades for 1, ou se estivermos em um modo de risco que depende do resultado anterior,
    // devemos garantir que não haja nenhuma ordem PENDENTE antes de calcular a próxima entrada.
    const isSequentialMode = settings.riskMode !== RiskMode.FIXED || (settings.maxConcurrentTrades || 1) === 1;
    
    if (isSequentialMode && tradesRef.current.some(t => t.result === TradeResult.PENDING)) {
        return;
    }

    const maxTrades = settings.maxConcurrentTrades || 1;
    if (openTradesCountRef.current >= maxTrades) return;
    if (processingAssets.current.has(assetName)) return;

    processingAssets.current.add(assetName);
    openTradesCountRef.current++;

    // 2️⃣ CÁLCULO DA ENTRADA (Sempre no momento da execução)
    // 🔥 Recalcula stats a partir do histórico real mais recente
    const currentStats = getSessionStats(tradesRef.current);

    console.log("🔥 SETTINGS RECEBIDO NA EXECUÇÃO:", {
      entryType: settings.entryType,
      entryFixedValue: settings.entryFixedValue,
      entryPercent: settings.entryPercent,
      riskMode: settings.riskMode,
      martingaleMultiplier: settings.martingaleMultiplier,
      maxMartingaleLevels: settings.maxMartingaleLevels,
      sorosLevels: settings.sorosLevels,
      entryManagementMode: settings.entryManagementMode,
      strategyCustomConfigs: settings.strategyCustomConfigs
    });

    if (settings.entryType === 'PERCENT') {
        console.warn(`⚠️ AVISO: O bot está em modo PERCENTUAL (${settings.entryPercent}%). Se você queria R$ ${settings.entryPercent}, mude para modo FIXO no Admin.`);
    }

    const entryAmount = RiskEngine.calculateEntry(
        walletRef.current.balance,
        sessionInitialBalance,
        settings,
        currentStats,
        strategyId
    );

    console.log("🚀 VALOR FINAL ENVIADO PARA BACKEND:", entryAmount);
    try {
      const result = await bridgeApi.placeOrder({
        asset: assetName,
        amount: entryAmount,
        action: direction.toLowerCase() as 'call' | 'put',
        type: 'binary',
        account_type: walletRef.current.accountType === 'DEMO' ? 'PRACTICE' : 'REAL'
      });

      console.log("🚀 RESPOSTA DA CORRETORA:", result);

      if (!result || result.error || (!result.id && !result.data?.id)) {
        throw new Error(result?.error || "ORDEM NÃO EXECUTADA NA CORRETORA");
      }

      const orderId = result.id || result.data?.id;
      const tradeInfo = result.data || result || {}; // Tenta pegar do data ou do topo
      const backendBalance = result.balance;

      let finalResult = TradeResult.PENDING;
      const statusStr = String(tradeInfo.status || result.status || '').toUpperCase();
      
      if (statusStr === 'WIN') finalResult = TradeResult.WIN;
      else if (statusStr === 'LOSS') finalResult = TradeResult.LOSS;
      else if (statusStr === 'OPEN' || statusStr === 'PENDING') finalResult = TradeResult.PENDING;

      const tradeProfit = Number(tradeInfo.profit || 0);

      const newTrade: Trade = {
          id: String(orderId),
          timestamp: Date.now(),
          asset: assetName,
          direction,
          amount: entryAmount,
          payout: tradeInfo.payout || 80,
          optionType: OptionType.BINARY,
          result: finalResult,
          profit: tradeProfit,
          strategyUsed: strategyId,
          strategyName,
          entryPrice: currentPriceSnapshot || latestPriceRef.current,
          finishedAt: finalResult !== TradeResult.PENDING ? Date.now() : undefined
      };

      console.log("📝 CRIANDO TRADE NO HISTÓRICO:", newTrade);

      const updatedHistory = [newTrade, ...tradesRef.current];
      tradesRef.current = updatedHistory;

      if (finalResult !== TradeResult.PENDING) {
          statsManager.updateStrategyStats(strategyId, finalResult === TradeResult.WIN, newTrade.profit);
          if (walletRef.current.accountType === 'REAL') {
              financeManager.registerTradeProfit(newTrade.profit, settings, false, userEmail);
          }
      }

      setTrades(updatedHistory);

      if (typeof backendBalance === 'number') {
          walletRef.current = { ...walletRef.current, balance: backendBalance };
          setWallet(prev => ({ ...prev, balance: backendBalance }));
      }

      refreshFinancialState();

      if (finalResult !== TradeResult.PENDING) {
          addToast(
              finalResult === TradeResult.WIN ? 'success' : 'error',
              'ORDEM FINALIZADA',
              `${assetName}: ${finalResult}`,
              `$ ${newTrade.profit.toFixed(2)}`
          );
      } else {
          addToast('info', 'ORDEM ABERTA', `${assetName}: Aguardando resultado...`);
      }

    } catch (error: any) {
       addToast('error', 'FALHA DE EXECUÇÃO', error.message);
    } finally {
       openTradesCountRef.current = Math.max(0, openTradesCountRef.current - 1);
       setTimeout(() => {
           processingAssets.current.delete(assetName);
       }, 500);
    }

  }, [
      isBrokerConnected,
      setTrades,
      setWallet,
      addToast,
      latestPriceRef,
      refreshFinancialState,
      userEmail,
      tradesRef,
      sessionInitialBalance
  ]);

  return { executeOrder };
};
