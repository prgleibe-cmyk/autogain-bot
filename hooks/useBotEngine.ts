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
        .filter(t => t.result === TradeResult.WIN || t.result === TradeResult.LOSS || t.result === TradeResult.ERROR);

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

        if (trade.result === TradeResult.LOSS || trade.result === TradeResult.ERROR) consecutiveLosses++;
        if (trade.result === TradeResult.WIN) {
            consecutiveWins++;
            cycleProfitPile += trade.profit;
        }
    }

    const shouldResetCycle =
        consecutiveWins > 0 ||
        cycleProfitPile > 0;

    return {
        consecutiveLosses: (lastResult === TradeResult.LOSS || lastResult === TradeResult.ERROR) ? consecutiveLosses : 0,
        consecutiveWins: lastResult === TradeResult.WIN ? consecutiveWins : 0,
        cycleProfitPile,
        currentCycleStep: (lastResult === TradeResult.LOSS || lastResult === TradeResult.ERROR) ? consecutiveLosses : 0
    };
};

export const useBotEngine = (props: any) => {
    const initialTrades = useMemo(() => {
        const saved = localStorage.getItem(`bot_trades_${props.userEmail}`);
        return saved ? JSON.parse(saved) : [];
    }, [props.userEmail]);

    const [status, setStatus] = useState<BotStatus>(BotStatus.IDLE);
    const [trades, setTrades] = useState<Trade[]>(initialTrades);

    useEffect(() => {
        localStorage.setItem(`bot_trades_${props.userEmail}`, JSON.stringify(trades));
    }, [trades, props.userEmail]);

    const [lastAnalysis, setLastAnalysis] = useState('Aguardando Início...');
    const [aiConfidence, setAiConfidence] = useState(0);
    const [currentAsset, setCurrentAsset] = useState('---');
    const [lastStrategyDetected, setLastStrategyDetected] = useState('Nenhuma');
    const [wakeUpTime, setWakeUpTime] = useState<number | null>(null);
    const [sessionInitialBalance, setSessionInitialBalance] = useState(props.wallet.balance);

    const statusRef = useRef<BotStatus>(BotStatus.IDLE);
    const latestPriceRef = useRef<number>(props.currentPrice || 0);
    const tradesRef = useRef<Trade[]>(initialTrades);
    const settingsRef = useRef(props.systemSettings);
    const isOperationPending = useRef<boolean>(initialTrades.some((t: Trade) => t.result === TradeResult.PENDING));

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
            const statusStr = String(data.result || data.status || '').toUpperCase();
            const hasResult = statusStr === 'WIN' || statusStr === 'LOSS' || statusStr === 'ERROR';

            if (orderId && hasResult) {
                const result = statusStr;
                const profit = Number(data.profit || 0);
                const balance = data.balance;

                console.log(`[BotEngine] 🏁 Resultado Recebido: ID ${orderId} | Result: ${result} | Profit: ${profit}`);
                
                if (result === 'ERROR') {
                    console.error(`[BotEngine] ❌ Ordem ${orderId} retornou ERRO do backend: ${data.message || 'Erro desconhecido'}`);
                }

                console.log(`[BotEngine] ✅ Resultado processado, liberando próxima entrada.`);
                isOperationPending.current = false;

                setTrades(prev => {
                    const index = prev.findIndex(t => t.id === orderId);
                    if (index === -1) return prev;

                    const updated = [...prev];
                    const trade = { ...updated[index] };

                    if (trade.result === TradeResult.PENDING) {
                        if (result === 'WIN') trade.result = TradeResult.WIN;
                        else if (result === 'LOSS') trade.result = TradeResult.LOSS;
                        else trade.result = TradeResult.ERROR;

                        trade.profit = profit;
                        trade.finishedAt = Date.now();
                        updated[index] = trade;

                        console.log(`[BotEngine] Trade ${orderId} atualizado para ${trade.result}`);

                        // 🔥 Atualiza o ref IMEDIATAMENTE para que o próximo cálculo de stake seja preciso
                        tradesRef.current = updated;

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

                // 🔥 Libera o bot para a próxima operação IMEDIATAMENTE após processar o resultado
                setStatus(BotStatus.ANALYZING);
            }

            // 2. Trata Dados de Mercado (Ingestion via Socket)
            if (data.type === 'MARKET_DATA_RESULT' && data.data) {
                const marketData = data.data;
                const assetsReceived = Object.keys(marketData);
                console.log(`[BotEngine] Recebido MARKET_DATA para ${assetsReceived.length} ativos.`);
                
                assetsReceived.forEach((asset) => {
                    const candles = marketData[asset];
                    if (Array.isArray(candles) && candles.length > 0) {
                        const normalizedAsset = asset.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                        MarketState.update(normalizedAsset, candles);
                    }
                });
                console.log("[BotEngine] Notificando MarketState...");
                MarketState.notifyUpdates();
            }

            // 3. Trata Lista de Ativos (Garante que o sistema use os ativos reais da corretora)
            if (data.type === 'GET_ASSETS_RESULT' && Array.isArray(data.assets)) {
                console.log(`[Socket] Sincronizando ${data.assets.length} ativos da corretora.`);
                // Dispara evento customizado para o useBotAssets capturar sem precisar de fetch
                window.dispatchEvent(new CustomEvent('broker_assets_sync', { detail: data.assets }));
            }
        };

        const handleDisconnect = () => {
            console.warn("[Socket] Desconexão detectada. Aguardando reconexão para receber o resultado da ordem...");
            // NÃO marcamos como erro aqui para evitar que o bot decida o próximo valor antes do resultado real.
            // O Watchdog cuidará do timeout se a conexão não voltar em 120s.
        };

        socketService.connect(handleSignal, handleStats, handleDisconnect);
        return () => socketService.disconnect();
    }, [
        props.userEmail,
        props.wallet.accountType,
        props.refreshFinancialState,
        props.setWallet
    ]);

    // ===============================
    // 🔥 SISTEMA GLOBAL ANTI-TRAVAMENTO (WATCHDOG)
    // ===============================
    useEffect(() => {
        const watchdog = setInterval(() => {
            const now = Date.now();
            const pendingTrades = tradesRef.current.filter(t => t.result === TradeResult.PENDING);
            
            // 1. TIMEOUT GLOBAL DE OPERAÇÃO (120s)
            pendingTrades.forEach(trade => {
                const elapsed = now - trade.timestamp;
                if (elapsed > 120000) {
                    console.error(`[Watchdog] 🚨 TIMEOUT CRÍTICO (120s) na ordem ${trade.id}. Forçando liberação.`);
                    isOperationPending.current = false; // Libera para próxima entrada
                    setTrades(prev => prev.map(t => 
                        t.id === trade.id ? { ...t, result: TradeResult.ERROR, finishedAt: now } : t
                    ));
                    
                    // Notifica o statsManager para não quebrar as métricas
                    statsManager.updateStrategyStats(trade.strategyUsed, false, 0);
                }
            });

            // 2. GARANTIA DE ESTADO (isOperating vs Real Activity)
            // Se o bot estiver "operando" (não IDLE) mas algo travar o fluxo de sinais
            // Aqui podemos adicionar verificações de integridade do MarketState
            if (statusRef.current === BotStatus.TRADING) {
                if (pendingTrades.length === 0) {
                    console.warn("[Watchdog] Bot em estado TRADING sem ordens pendentes. Resetando para ANALYZING.");
                    setStatus(BotStatus.ANALYZING);
                }
            }

            if (statusRef.current === BotStatus.ANALYZING) {
                const lastTick = MarketState.getLastUpdateTimestamp();
                if (now - lastTick > 30000 && props.isBrokerConnected) {
                    console.warn("[Watchdog] MarketState estagnado há mais de 30s. Solicitando refresh forçado.");
                    // Força um novo pedido de dados
                    socketService.socket?.emit('GET_MARKET_DATA', {
                        request_id: `WATCHDOG_REFRESH_${now}`,
                        assets: props.activeAssets,
                        timeframe: 60,
                        count: 60
                    });
                }
            }
        }, 5000);

        return () => clearInterval(watchdog);
    }, [props.isBrokerConnected, props.activeAssets]);

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
            console.log(`[BotEngine] Solicitando MARKET_DATA para: ${props.activeAssets.join(', ')}`);
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
        setStatus,
        latestPriceRef,
        refreshFinancialState: props.refreshFinancialState,
        userEmail: props.userEmail,
        isOperationPending
    });

    // 🔥 BLOCO DE EXECUÇÃO – ESCUTA SINAIS DO HIVEMIND
    useEffect(() => {
        const hive = HiveMind.getInstance();

        const handleNewSignal = (signal: Signal) => {
            if (statusRef.current !== BotStatus.ANALYZING) return;

            // 🛡️ GARANTIA DE OPERAÇÃO ÚNICA
            if (isOperationPending.current) {
                console.warn("[BotEngine] ⏳ Operação pendente, nova entrada bloqueada.");
                return;
            }

            const hasOpenTrades = tradesRef.current.some(
                t => t.result === TradeResult.PENDING
            );

            if (hasOpenTrades) {
                console.warn("[BotEngine] ⏳ Existe trade pendente no histórico, bloqueando nova entrada.");
                isOperationPending.current = true; // Sincroniza se necessário
                return;
            }

            setCurrentAsset(signal.asset);
            setLastStrategyDetected(signal.strategyName);
            setAiConfidence(Math.round(signal.confidence));
            setLastAnalysis(`${signal.strategyName}: Entrada em ${signal.asset}`);
            
            // 🔥 CÁLCULO DA PRÓXIMA STAKE (getNextStake)
            const currentStats = getSessionStats(tradesRef.current);
            console.log(`[BotEngine] 📊 Calculando stake para sinal:`, {
                asset: signal.asset,
                strategy: signal.strategyName,
                consecutiveLosses: currentStats.consecutiveLosses,
                balance: props.wallet.balance
            });

            const nextAmount = RiskEngine.calculateEntry(
                props.wallet.balance,
                sessionInitialBalance,
                props.systemSettings,
                currentStats,
                signal.strategyId
            );

            console.log(`[BotEngine] 🚀 Valor calculado para o sinal: ${nextAmount}`);
            
            isOperationPending.current = true;
            setStatus(BotStatus.TRADING);
            
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