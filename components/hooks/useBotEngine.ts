import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BotStatus, Trade, Signal, TradeResult, DailyGoalConfig } from '../types';
import { RiskEngine } from '../services/risk/RiskEngine';
import { HiveMind } from '../services/hive';
import { useTradeExecutor } from './useTradeExecutor';
import { socketService } from '../services/socketService';
import { financeManager } from '../services/financeManager';
import { statsManager } from '../services/statsManager';
import { MarketState } from '../services/marketState';
import { dailyGoalGuard } from '../services/dailyGoalGuard';

/**
 * Utilitário central para calcular estatísticas de sessão
 */
export const getSessionStats = (trades: Trade[]) => {
    const finishedHistory = trades
        .filter(t => t.result === TradeResult.WIN || t.result === TradeResult.LOSS);

    if (finishedHistory.length === 0) {
        return {
            consecutiveLosses: 0,
            consecutiveWins: 0,
            cycleProfitPile: 0,
            currentCycleStep: 0
        };
    }

    let consecutiveLosses = 0;
    let consecutiveWins = 0;
    let cycleProfitPile = 0;

    const lastResult = finishedHistory[0].result;

    for (const trade of finishedHistory) {
        if (trade.result !== lastResult) break;

        if (trade.result === TradeResult.LOSS) consecutiveLosses++;
        if (trade.result === TradeResult.WIN) {
            consecutiveWins++;
            cycleProfitPile += trade.profit;
        }
    }

    const shouldResetCycle =
        consecutiveWins > 0 ||
        cycleProfitPile > 0;

    return {
        consecutiveLosses: shouldResetCycle ? 0 : consecutiveLosses,
        consecutiveWins,
        cycleProfitPile,
        currentCycleStep: shouldResetCycle ? 0 : consecutiveLosses
    };
};

export const useBotEngine = (props: any) => {
    const [status, setStatus] = useState<BotStatus>(BotStatus.IDLE);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [lastAnalysis, setLastAnalysis] = useState('Aguardando Início...');
    const [aiConfidence, setAiConfidence] = useState(0);
    const [currentAsset, setCurrentAsset] = useState('---');
    const [lastStrategyDetected, setLastStrategyDetected] = useState('Nenhuma');
    const [wakeUpTime, setWakeUpTime] = useState<number | null>(null);
    const [sessionInitialBalance, setSessionInitialBalance] = useState(props.wallet.balance);

    const statusRef = useRef<BotStatus>(BotStatus.IDLE);
    const latestPriceRef = useRef<number>(props.currentPrice || 0);
    const tradesRef = useRef<Trade[]>([]);
    const settingsRef = useRef(props.systemSettings);

    useEffect(() => { settingsRef.current = props.systemSettings; }, [props.systemSettings]);
    useEffect(() => { tradesRef.current = trades; }, [trades]);
    useEffect(() => { statusRef.current = status; }, [status]);
    useEffect(() => { latestPriceRef.current = props.currentPrice; }, [props.currentPrice]);

    // ===============================
    // SOCKET
    // ===============================
    useEffect(() => {
        const handleSignal = (data: any) => {
            console.log("[Socket] Sinal Externo:", data);
        };

        const handleStats = (data: any) => {
            console.log("[Socket] Mensagem do Cérebro:", data);

            // 1. Trata Resultados de Ordens
            const orderId = String(data.request_id || data.order_id || data.id || '');
            const hasResult = data.result || data.status === 'WIN' || data.status === 'LOSS';

            if (orderId && hasResult) {
                const result = data.result || data.status;
                const profit = Number(data.profit || 0);
                const balance = data.balance;

                setTrades(prev => {
                    const index = prev.findIndex(t => t.id === orderId);
                    if (index === -1) return prev;

                    const updated = [...prev];
                    const trade = { ...updated[index] };

                    if (trade.result === TradeResult.PENDING) {
                        trade.result =
                            String(result).toUpperCase() === 'WIN'
                                ? TradeResult.WIN
                                : TradeResult.LOSS;

                        trade.profit = profit;
                        trade.finishedAt = Date.now();
                        updated[index] = trade;

                        statsManager.updateStrategyStats(
                            trade.strategyUsed,
                            trade.result === TradeResult.WIN,
                            profit
                        );

                        if (props.wallet.accountType === 'REAL') {
                            financeManager.registerTradeProfit(
                                profit,
                                settingsRef.current,
                                false,
                                props.userEmail
                            );
                        }

                        props.refreshFinancialState();
                    }

                    return updated;
                });

                if (typeof balance === 'number') {
                    props.setWallet((prev: any) => ({ ...prev, balance }));
                }
            }

            // 2. Trata Dados de Mercado (Ingestion via Socket)
            if (data.type === 'MARKET_DATA_RESULT' && data.data) {
                const marketData = data.data;
                Object.keys(marketData).forEach((asset) => {
                    const candles = marketData[asset];
                    if (Array.isArray(candles) && candles.length > 0) {
                        // Normaliza o nome do ativo para garantir compatibilidade com o resto do sistema
                        const normalizedAsset = asset.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                        MarketState.update(normalizedAsset, candles);
                    }
                });
                MarketState.notifyUpdates();
            }

            // 3. Trata Lista de Ativos (Garante que o sistema use os ativos reais da corretora)
            if (data.type === 'GET_ASSETS_RESULT' && Array.isArray(data.assets)) {
                console.log(`[Socket] Sincronizando ${data.assets.length} ativos da corretora.`);
                // Dispara evento customizado para o useBotAssets capturar sem precisar de fetch
                window.dispatchEvent(new CustomEvent('broker_assets_sync', { detail: data.assets }));
            }
        };

        socketService.connect(handleSignal, handleStats);
        return () => socketService.disconnect();
    }, [
        props.userEmail,
        props.wallet.accountType,
        props.refreshFinancialState,
        props.setWallet
    ]);

    // ===============================
    // HIVE CONFIG
    // ===============================
    useEffect(() => {
        const hive = HiveMind.getInstance();
        hive.configure(
            props.systemSettings.marketFilters,
            props.systemSettings.enabledStrategies
        );

        if (status === BotStatus.ANALYZING) {
            hive.start();
        } else {
            hive.stop();
        }
    }, [status, props.systemSettings]);

    // 🔥 BLOCO DE INGESTÃO – SOLICITA MARKET DATA PERIODICAMENTE
    useEffect(() => {
        if (!props.isBrokerConnected) return;
        if (!props.activeAssets?.length) return;
        if (status !== BotStatus.ANALYZING) return;

        const fetchMarketData = () => {
            const requestId = `DATA_${Date.now()}`;
            socketService.socket?.emit('GET_MARKET_DATA', {
                request_id: requestId,
                assets: props.activeAssets,
                timeframe: 60,
                count: 60
            });
        };

        fetchMarketData();
        const interval = setInterval(fetchMarketData, 2000); // Loop de 2 segundos
        return () => clearInterval(interval);

    }, [status, props.isBrokerConnected, props.activeAssets]);

    const resetSession = useCallback(() => {
        setTrades([]);
        setSessionInitialBalance(props.wallet.balance);
    }, [props.wallet.balance]);

    const stats = useMemo(() => getSessionStats(trades), [trades]);

    const { executeOrder } = useTradeExecutor({
        ...props,
        setTrades,
        tradesRef,
        sessionStats: stats,
        sessionInitialBalance,
        statusRef,
        latestPriceRef,
        refreshFinancialState: props.refreshFinancialState,
        userEmail: props.userEmail
    });

    // 🔥 BLOCO DE EXECUÇÃO – ESCUTA SINAIS DO HIVEMIND
    useEffect(() => {
        const hive = HiveMind.getInstance();

        const handleNewSignal = (signal: Signal) => {
            if (statusRef.current !== BotStatus.ANALYZING) return;

            const hasOpenTrades = tradesRef.current.some(
                t => t.result === TradeResult.PENDING
            );

            if (hasOpenTrades) return;

            setCurrentAsset(signal.asset);
            setLastStrategyDetected(signal.strategyName);
            setAiConfidence(Math.round(signal.confidence));
            setLastAnalysis(`${signal.strategyName}: Entrada em ${signal.asset}`);
            
            executeOrder(
                signal.direction,
                signal.strategyId,
                signal.strategyName,
                signal.asset,
                props.wallet,
                props.systemSettings,
                latestPriceRef.current
            );
        };

        const unsubscribe = hive.onSignal(handleNewSignal);
        return () => { unsubscribe(); };
    }, [props.wallet, props.systemSettings, executeOrder]);

    const toggleBot = useCallback(() => {
        setStatus(prev =>
            prev === BotStatus.IDLE
                ? BotStatus.ANALYZING
                : BotStatus.IDLE
        );

        if (status === BotStatus.IDLE) {
            setSessionInitialBalance(props.wallet.balance);
        }
    }, [props.wallet.balance, status]);

    const currentEntryAmount = useMemo(() => {
        const pendingTrade = trades.find(t => t.result === TradeResult.PENDING);
        if (pendingTrade) return pendingTrade.amount;

        return RiskEngine.calculateEntry(
            props.wallet.balance,
            sessionInitialBalance,
            props.systemSettings,
            stats
        );
    }, [
        props.wallet.balance,
        sessionInitialBalance,
        props.systemSettings,
        trades,
        stats
    ]);

    return {
        status,
        setStatus,
        toggleBot,
        trades,
        lastAnalysis,
        aiConfidence,
        currentAsset,
        lastStrategyDetected,
        resetSession,
        wakeUpTime,
        activeAssetCount: props.activeAssets?.length || 0,
        currentEntryAmount,
        currentCycleStep: stats.currentCycleStep,
        consecutiveLosses: stats.consecutiveLosses,
        sessionInitialBalance
    };
};