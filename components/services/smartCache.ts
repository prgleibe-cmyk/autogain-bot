
import { MarketCandle } from '../types';

interface AssetMemory {
    lastCandleTime: number;
    lastPrice: number;
    lastTickTimestamp: number;
}

/**
 * SMART CACHE SERVICE
 * 
 * Responsável por eliminar reprocessamento desnecessário.
 * Armazena o estado anterior de cada ativo e determina se uma nova análise é necessária.
 * 
 * Critérios de Evento:
 * 1. Novo Candle (Fechamento)
 * 2. Variação de Preço Relevante (Tick > Threshold)
 */
export const SmartCache = {
    memory: new Map<string, AssetMemory>(),
    
    // Sensibilidade do Tick (0.5 pips para Forex major)
    TICK_THRESHOLD: 0.00005, 

    /**
     * Verifica se o ativo precisa ser reanalisado.
     * Retorna TRUE se houver um evento relevante.
     */
    shouldAnalyze: (asset: string, candles: MarketCandle[]): boolean => {
        if (!candles || candles.length === 0) return false;
        
        const currentCandle = candles[candles.length - 1];
        const cached = SmartCache.memory.get(asset);

        // 1. Inicialização (Primeira Leitura)
        if (!cached) {
            SmartCache.memory.set(asset, {
                lastCandleTime: currentCandle.time,
                lastPrice: currentCandle.close,
                lastTickTimestamp: Date.now()
            });
            return true;
        }

        // 2. Evento: Novo Candle Detectado
        if (currentCandle.time > cached.lastCandleTime) {
            cached.lastCandleTime = currentCandle.time;
            cached.lastPrice = currentCandle.close;
            cached.lastTickTimestamp = Date.now();
            return true;
        }

        // 3. Evento: Movimento de Preço (Tick Relevante)
        const priceDiff = Math.abs(currentCandle.close - cached.lastPrice);
        if (priceDiff >= SmartCache.TICK_THRESHOLD) {
            cached.lastPrice = currentCandle.close;
            cached.lastTickTimestamp = Date.now();
            return true;
        }

        // Sem mudanças relevantes -> Cache Hit (Ignorar processamento)
        return false;
    },

    /**
     * Limpa o cache (ex: ao trocar de conta ou reiniciar sessão)
     */
    clear: () => {
        SmartCache.memory.clear();
    }
};
