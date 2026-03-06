
import type { MarketSnapshot, Signal } from '../../types';
import { calculateRSI, calculateBollingerBands } from '../indicators';
import { isNearRoundNumber, getWickRejection } from './utils';

/**
 * ESTRATÉGIA: QUICK RETRACTION (M1)
 * Foco: Reversão imediata em pontos de sobrecompra/sobrevenda externa às bandas.
 * Ajuste: Adicionado filtro de rejeição por pavio e proximidade de taxas.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];

    for (const asset in snapshot) {
        const candles = snapshot[asset];
        if (candles.length < 30) continue;

        const closes = candles.map(c => c.close);
        const current = candles[candles.length - 1];
        
        // Bandas com desvio 2.5 (Mais conservador para sinais M1)
        const bb = calculateBollingerBands(closes, 20, 2.5);
        const rsi = calculateRSI(closes, 14);

        const nearTaxa = isNearRoundNumber(current.close);
        const lowerRejection = getWickRejection(current, 'CALL');
        const upperRejection = getWickRejection(current, 'PUT');

        // SOBRECOMPRA EXTERNA (Venda)
        if (current.close >= bb.upper && rsi > 70) {
            let confidence = 88;
            if (nearTaxa) confidence += 5;
            if (upperRejection > 0.6) confidence += 4;

            if (upperRejection > 0.3) { // Exige pelo menos um pouco de rejeição
                signals.push({
                    asset,
                    direction: 'PUT',
                    confidence: Math.min(confidence, 98),
                    reason: `Exaustão BB Superior + RSI ${rsi.toFixed(0)}${nearTaxa ? ' + Taxa' : ''}`,
                    strategyId: 'QUICK_RETRACTION',
                    strategyName: 'Retração BB',
                    score: 0
                });
            }
        } 
        // SOBREVENDA EXTERNA (Compra)
        else if (current.close <= bb.lower && rsi < 30) {
            let confidence = 88;
            if (nearTaxa) confidence += 5;
            if (lowerRejection > 0.6) confidence += 4;

            if (lowerRejection > 0.3) { // Exige pelo menos um pouco de rejeição
                signals.push({
                    asset,
                    direction: 'CALL',
                    confidence: Math.min(confidence, 98),
                    reason: `Exaustão BB Inferior + RSI ${rsi.toFixed(0)}${nearTaxa ? ' + Taxa' : ''}`,
                    strategyId: 'QUICK_RETRACTION',
                    strategyName: 'Retração BB',
                    score: 0
                });
            }
        }
    }
    return signals;
};

export default {
    id: 'QUICK_RETRACTION',
    name: 'Retração Bollinger',
    description: 'Reversão: Toque nas Bandas de Bollinger com RSI extremo. Foco em exaustão.',
    marketType: 'BOTH',
    timeframe: 'M1',
    bypassGlobalFilters: true,
    analyze
};
