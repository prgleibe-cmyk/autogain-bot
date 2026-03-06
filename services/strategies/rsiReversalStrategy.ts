
import type { MarketSnapshot, Signal } from '../../types';
import { calculateRSI } from '../indicators';
import { isVolumeExhausted, getWickRejection } from './utils';

/**
 * ESTRATÉGIA: RSI REVERSAL (M1)
 * Foco: Extremos de RSI (70/30) com confirmação de vela de reversão.
 * Ajuste: Adicionado filtro de volume e rejeição de pavio.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];

    for (const asset in snapshot) {
        const candles = snapshot[asset];
        if (candles.length < 30) continue;

        const closes = candles.map(c => c.close);
        const rsi = calculateRSI(closes, 14);
        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2];

        const volExhausted = isVolumeExhausted(candles);
        const lowerRejection = getWickRejection(last, 'CALL');
        const upperRejection = getWickRejection(last, 'PUT');

        // SOBRECOMPRA -> Aguarda vela vermelha para confirmar ou pavio longo
        if (rsi >= 72) {
            const isReversalCandle = last.close < last.open || upperRejection > 0.7;
            
            if (isReversalCandle) {
                let confidence = 85;
                if (volExhausted) confidence += 7;
                if (upperRejection > 1.0) confidence += 5; // Pavio maior que o corpo

                signals.push({
                    asset,
                    direction: 'PUT',
                    confidence: Math.min(confidence, 98),
                    reason: `RSI Extremo (${rsi.toFixed(0)})${volExhausted ? ' + Clímax Vol' : ''}`,
                    strategyId: 'RSI_REVERSAL',
                    strategyName: 'RSI Reversal',
                    score: 0
                });
            }
        } 
        // SOBREVENDA -> Aguarda vela verde para confirmar ou pavio longo
        else if (rsi <= 28) {
            const isReversalCandle = last.close > last.open || lowerRejection > 0.7;

            if (isReversalCandle) {
                let confidence = 85;
                if (volExhausted) confidence += 7;
                if (lowerRejection > 1.0) confidence += 5;

                signals.push({
                    asset,
                    direction: 'CALL',
                    confidence: Math.min(confidence, 98),
                    reason: `RSI Extremo (${rsi.toFixed(0)})${volExhausted ? ' + Clímax Vol' : ''}`,
                    strategyId: 'RSI_REVERSAL',
                    strategyName: 'RSI Reversal',
                    score: 0
                });
            }
        }
    }

    return signals;
};

export default {
    id: 'RSI_REVERSAL',
    name: 'RSI Extremo',
    description: 'Reversão: RSI em níveis de sobrecompra/venda com confirmação de cor.',
    marketType: 'BOTH',
    timeframe: 'M1',
    bypassGlobalFilters: false,
    analyze
};
