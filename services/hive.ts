
import type { MarketSnapshot, Signal, MarketFilterSettings } from '../types';
import { MarketType } from '../types';
import { STRATEGY_REGISTRY, STRATEGY_WEIGHTS } from './strategyRegistry';
import { canEnterTradeGlobal } from './globalMarketFilters';
import { MarketState } from './marketState';
import { autoCalibrationService } from './autoCalibrationService';

export type SignalCallback = (signal: Signal) => void;

export class HiveMind {
    private static instance: HiveMind;
    private listeners: Set<SignalCallback> = new Set();
    private settings: MarketFilterSettings | null = null;
    private enabledStrategies: Record<string, boolean> = {};
    private isRunning: boolean = false;
    private lastExecutionTimestamp: number = 0;
    private executedCandleSet: Set<string> = new Set();

    private constructor() {
        console.log("[HiveMind] Inicializando e subscrevendo ao MarketState...");
        MarketState.subscribe(() => this.processTick());
    }

    public static getInstance(): HiveMind {
        if (!HiveMind.instance) HiveMind.instance = new HiveMind();
        return HiveMind.instance;
    }

    public configure(settings: MarketFilterSettings, enabledStrategies: Record<string, boolean>) {
        this.settings = settings;
        this.enabledStrategies = enabledStrategies || {};
        
        // Garantia: Se não houver nenhuma estratégia ativa, ativa a de teste por padrão para não deixar o bot "morto"
        const hasActive = Object.values(this.enabledStrategies).some(v => v === true);
        if (!hasActive) {
            console.log("[HiveMind] Nenhuma estratégia ativa detectada nas configurações. Ativando modo de segurança.");
            this.enabledStrategies['EMA_CROSSOVER_M1'] = true;
            this.enabledStrategies['TEST_HIGH_FREQ'] = true;
        }
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("%c[HiveMind] MOTOR DE ANÁLISE ULTRA-RÁPIDA ATIVADO", "color: #10b981; font-weight: bold;");
    }

    public stop() {
        this.isRunning = false;
    }

    public onSignal(cb: SignalCallback) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    private processTick() {
        if (!this.isRunning) return;

        const now = Date.now();
        // Delay de segurança reduzido para 0.5s para resposta ultra-rápida
        if (now - this.lastExecutionTimestamp < 500) return;

        const snapshot = MarketState.getAll();
        const assetKeys = Object.keys(snapshot);
        if (assetKeys.length === 0) {
            console.log("[HiveMind] Snapshot vazio. MarketState não possui dados válidos ou recentes. Cache size:", MarketState.size());
            return;
        }

        const marketSnapshot: MarketSnapshot = {};
        assetKeys.forEach(k => { marketSnapshot[k] = snapshot[k].candles; });

        const activeStrategies = Object.values(STRATEGY_REGISTRY).filter(s => this.enabledStrategies[s.id]);
        
        if (activeStrategies.length === 0) {
            console.warn("[HiveMind] Nenhuma estratégia ativa configurada.");
            return;
        }

        console.log(`[HiveMind] Analisando ${assetKeys.length} ativos com ${activeStrategies.length} estratégias ativas.`);

        // Coletor de sinais para priorização (Elite Selection)
        const potentialSignals: (Signal & { finalScore: number })[] = [];

        for (const strategy of activeStrategies) {
            try {
                const signals = strategy.analyze(marketSnapshot);
                if (!signals || signals.length === 0) continue;

                for (const sig of signals) {
                    const candles = marketSnapshot[sig.asset];
                    if (!candles || candles.length === 0) continue;
                    
                    const lastCandle = candles[candles.length - 1];
                    const candleKey = `${sig.asset}_${sig.direction}_${lastCandle.time}`;

                    if (this.executedCandleSet.has(candleKey)) continue;

                    if (this.evaluateSignal(sig, strategy, candles)) {
                        const weight = STRATEGY_WEIGHTS[sig.strategyId] || 1.0;
                        // O score final combina confiança da estratégia + peso da estratégia
                        const finalScore = sig.confidence * weight;
                        potentialSignals.push({ ...sig, finalScore });
                    }
                }
            } catch (e) {
                console.error(`[HiveMind] Erro na estratégia ${strategy.id}:`, e);
            }
        }

        // Se houver múltiplos sinais em diferentes ativos, escolhe o de maior score absoluto
        if (potentialSignals.length > 0) {
            // Ordena do maior score para o menor
            potentialSignals.sort((a, b) => b.finalScore - a.finalScore);
            
            const bestSignal = potentialSignals[0];
            console.log(`%c[HiveMind] SINAL DETECTADO: ${bestSignal.asset} | ${bestSignal.strategyName} | Conf: ${bestSignal.confidence}% | Score: ${bestSignal.finalScore.toFixed(2)}`, "color: #fbbf24; font-weight: bold;");
            
            const lastCandle = marketSnapshot[bestSignal.asset][marketSnapshot[bestSignal.asset].length - 1];
            const candleKey = `${bestSignal.asset}_${bestSignal.direction}_${lastCandle.time}`;

            this.executedCandleSet.add(candleKey);
            this.lastExecutionTimestamp = Date.now();
            
            this.listeners.forEach(l => l(bestSignal));
        }

        // Limpeza de cache de execução
        if (this.executedCandleSet.size > 50) {
            const keys = Array.from(this.executedCandleSet);
            this.executedCandleSet = new Set(keys.slice(-10));
        }
    }

    private evaluateSignal(sig: Signal, strategy: any, candles: any): boolean {
        const isOTC = sig.asset.toUpperCase().includes('OTC');
        if (strategy.marketType === 'OPEN' && isOTC) return false;
        if (strategy.marketType === 'OTC' && !isOTC) return false;

        if (!strategy.bypassGlobalFilters && this.settings) {
            let effectiveSettings = this.settings;
            
            // 🔥 APLICA AUTO-CALIBRAGEM NEURAL SE ATIVADA
            if (this.settings.autoCalibration) {
                effectiveSettings = autoCalibrationService.calculateDynamicFilters(candles, this.settings);
            }

            const globalCheck = canEnterTradeGlobal(
                candles,
                isOTC ? MarketType.OTC : MarketType.OPEN,
                sig.direction,
                effectiveSettings
            );
            
            if (!globalCheck.allowed) {
                // Opcional: Logar motivo do bloqueio para debug
                console.log(`[HiveMind] Sinal bloqueado: ${sig.asset} - Motivo: ${globalCheck.reason}`);
                return false;
            }
        }
        return true;
    }
}
