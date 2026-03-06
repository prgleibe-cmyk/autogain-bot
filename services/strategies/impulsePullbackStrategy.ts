
import type { MarketSnapshot, Signal } from '../../types';
import { calculateEMA } from '../indicators';

/**
 * ESTRATÉGIA: IMPULSE & PULLBACK (M1)
 * Foco: Entrar na retomada da tendência após toque na média rápida.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];

    for (const asset in snapshot) {
        const candles = snapshot[asset];
        if (candles.length < 40) continue;

        const closes = candles.map(c => c.close);
        const ema20 = calculateEMA(closes, 20);
        const ema50 = calculateEMA(closes, 50);
        
        const last = closes.length - 1;
        const current = candles[last];
        const prev = candles[last - 1];

        const trendUp = ema20[last] > ema50[last];
        const trendDown = ema20[last] < ema50[last];

        // SETUP CALL: Tendência de alta + Toque na EMA20 + Vela de Rejeição/Retomada
        if (trendUp && current.low <= ema20[last] && current.close > ema20[last]) {
            const lowerWick = Math.min(current.open, current.close) - current.low;
            if (lowerWick > 0.00002) {
                signals.push({
                    asset,
                    direction: 'CALL',
                    confidence: 85,
                    reason: 'Pullback EMA20 em Alta',
                    strategyId: 'IMPULSE_PULLBACK_M1',
                    strategyName: 'Impulse PB',
                    score: 0
                });
            }
        }

        // SETUP PUT: Tendência de baixa + Toque na EMA20 + Vela de Rejeição
        else if (trendDown && current.high >= ema20[last] && current.close < ema20[last]) {
            const upperWick = current.high - Math.max(current.open, current.close);
            if (upperWick > 0.00002) {
                signals.push({
                    asset,
                    direction: 'PUT',
                    confidence: 85,
                    reason: 'Pullback EMA20 em Baixa',
                    strategyId: 'IMPULSE_PULLBACK_M1',
                    strategyName: 'Impulse PB',
                    score: 0
                });
            }
        }
    }
    return signals;
};

export default {
    id: 'IMPULSE_PULLBACK_M1',
    name: 'Scalping Impulso & Pullback',
    description: 'Tendência: Identifica retomada após pullback na EMA 20. Confirmação por pavio.',
    marketType: 'BOTH',
    timeframe: 'M1',
    bypassGlobalFilters: true,
    analyze
};
