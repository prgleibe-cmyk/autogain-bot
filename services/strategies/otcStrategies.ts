
import type { MarketSnapshot, Signal } from '../../types';
import { calculateEMA } from '../indicators';

/**
 * ESTRATÉGIA: OTC MASTER (M1)
 * Foco: Fluxo de velas e reversão de exaustão, típicos de algoritmos OTC.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];

    for (const asset in snapshot) {
        if (!asset.toUpperCase().includes('OTC')) continue; 

        const candles = snapshot[asset];
        if (candles.length < 20) continue;

        // 1. ESTRATÉGIA DE FLUXO (Sequência de 5 cores)
        const recent = candles.slice(-5);
        const allGreen = recent.every(c => c.close > c.open);
        const allRed = recent.every(c => c.close < c.open);

        if (allGreen) {
            signals.push({ 
                asset, 
                direction: 'CALL', 
                confidence: 88, 
                reason: 'OTC Fluxo: 5 Verdes consecutivas', 
                strategyId: 'OTC_STRATEGIES', 
                strategyName: 'OTC Master', 
                score: 0 
            });
        } else if (allRed) {
            signals.push({ 
                asset, 
                direction: 'PUT', 
                confidence: 88, 
                reason: 'OTC Fluxo: 5 Vermelhas consecutivas', 
                strategyId: 'OTC_STRATEGIES', 
                strategyName: 'OTC Master', 
                score: 0 
            });
        }

        // 2. ESTRATÉGIA ELÁSTICA (Reversão à Média)
        const closes = candles.map(c => c.close);
        const ema5 = calculateEMA(closes, 5);
        const current = candles[candles.length - 1];
        const lastEma = ema5[ema5.length - 1];

        // Se o preço distanciou muito da EMA 5 (Exaustão rápida)
        const distance = Math.abs(current.close - lastEma);
        const threshold = current.close * 0.0006; // Sensibilidade do elástico

        if (distance > threshold) {
            if (current.close > lastEma && current.close > current.open) {
                signals.push({ 
                    asset, 
                    direction: 'PUT', 
                    confidence: 85, 
                    reason: 'OTC Elástico: Exaustão acima da média', 
                    strategyId: 'OTC_STRATEGIES', 
                    strategyName: 'OTC Master', 
                    score: 0 
                });
            } else if (current.close < lastEma && current.close < current.open) {
                signals.push({ 
                    asset, 
                    direction: 'CALL', 
                    confidence: 85, 
                    reason: 'OTC Elástico: Exaustão abaixo da média', 
                    strategyId: 'OTC_STRATEGIES', 
                    strategyName: 'OTC Master', 
                    score: 0 
                });
            }
        }
    }
    return signals;
};

export default {
    id: 'OTC_STRATEGIES',
    name: 'OTC Master (Fluxo + Elástico)',
    description: 'OTC ONLY: Combina lógica de Fluxo de Cor e Reversão à Média rápida.',
    marketType: 'OTC',
    timeframe: 'M1',
    bypassGlobalFilters: true,
    analyze
};
