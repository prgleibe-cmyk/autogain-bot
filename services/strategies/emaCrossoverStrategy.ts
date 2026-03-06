
import { MarketSnapshot, Signal } from '../../types';
import { calculateEMA, calculateRSI } from '../indicators';

/**
 * ESTRATÉGIA: EMA CROSSOVER PRO (M1)
 * Foco: Mudança de tendência confirmada por cruzamento e momentum.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];

    for (const asset in snapshot) {
        const candles = snapshot[asset];
        if (candles.length < 30) continue;

        const closes = candles.map(c => c.close);
        const emaFast = calculateEMA(closes, 9);
        const emaSlow = calculateEMA(closes, 21);
        const rsi = calculateRSI(closes, 14);
        
        const last = emaFast.length - 1;
        
        // Verifica se houve cruzamento nos últimos 3 candles (Zona de Cruzamento)
        const crossedUp = (emaFast[last-1] <= emaSlow[last-1] && emaFast[last] > emaSlow[last]) || 
                         (emaFast[last-2] <= emaSlow[last-2] && emaFast[last-1] > emaSlow[last-1]);
                         
        const crossedDown = (emaFast[last-1] >= emaSlow[last-1] && emaFast[last] < emaSlow[last]) || 
                           (emaFast[last-2] >= emaSlow[last-2] && emaFast[last-1] < emaSlow[last-1]);

        // Condições de Compra
        if (crossedUp && rsi > 52 && rsi < 70) {
            signals.push({
                asset,
                direction: 'CALL',
                confidence: 86,
                reason: 'Cruzamento Altista + Momentum RSI',
                strategyId: 'EMA_CROSSOVER_M1',
                strategyName: 'EMA Cross Pro',
                score: 0
            });
        } 
        // Condições de Venda
        else if (crossedDown && rsi < 48 && rsi > 30) {
            signals.push({
                asset,
                direction: 'PUT',
                confidence: 86,
                reason: 'Cruzamento Baixista + Momentum RSI',
                strategyId: 'EMA_CROSSOVER_M1',
                strategyName: 'EMA Cross Pro',
                score: 0
            });
        }
    }
    return signals;
};

export default {
    id: 'EMA_CROSSOVER_M1',
    name: 'EMA Crossover Pro M1',
    description: 'Tendência: Cruzamento EMA 9/21 com filtros RSI. Confirmação de momentum.',
    marketType: 'BOTH',
    timeframe: 'M1',
    bypassGlobalFilters: false,
    analyze
};
