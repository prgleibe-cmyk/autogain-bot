
import { MarketSnapshot, Signal } from '../../types';
import { calculateEMA } from '../indicators';

/**
 * ESTRATÉGIA: TREND FOLLOWING EMA (M1)
 * Foco: Operar a favor da tendência quando as médias estão alinhadas e o preço corrige.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];

    for (const asset in snapshot) {
        const candles = snapshot[asset];
        if (candles.length < 60) continue;

        const closes = candles.map(c => c.close);
        const ema9 = calculateEMA(closes, 9);
        const ema21 = calculateEMA(closes, 21);
        const ema100 = calculateEMA(closes, 100);

        const last = closes.length - 1;
        const current = candles[last];

        // TENDÊNCIA DE ALTA FORTE: 9 > 21 > 100
        const upTrend = ema9[last] > ema21[last] && ema21[last] > ema100[last];
        // TENDÊNCIA DE BAIXA FORTE: 9 < 21 < 100
        const downTrend = ema9[last] < ema21[last] && ema21[last] < ema100[last];

        if (upTrend) {
            // Entrada no Pullback: Preço toca a EMA 9 ou 21 e fecha acima
            if (current.low <= ema9[last] && current.close > ema9[last] && current.close > current.open) {
                signals.push({
                    asset,
                    direction: 'CALL',
                    confidence: 88,
                    reason: 'Trend Follow: Retomada após Pullback em Alta',
                    strategyId: 'TREND_FOLLOWING_M1',
                    strategyName: 'Trend Follower',
                    score: 0
                });
            }
        } 
        else if (downTrend) {
            // Entrada no Pullback: Preço toca a EMA 9 ou 21 e fecha abaixo
            if (current.high >= ema9[last] && current.close < ema9[last] && current.close < current.open) {
                signals.push({
                    asset,
                    direction: 'PUT',
                    confidence: 88,
                    reason: 'Trend Follow: Retomada após Pullback em Baixa',
                    strategyId: 'TREND_FOLLOWING_M1',
                    strategyName: 'Trend Follower',
                    score: 0
                });
            }
        }
    }
    return signals;
};

export default {
    id: 'TREND_FOLLOWING_M1',
    name: 'Trend Follow M1 (EMA)',
    description: 'Tendência: Alinhamento EMA 9/21/100 com entrada em pullbacks curtos.',
    marketType: 'BOTH',
    timeframe: 'M1',
    bypassGlobalFilters: false,
    analyze
};
