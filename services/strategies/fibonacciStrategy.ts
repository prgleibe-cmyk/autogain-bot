
import { MarketSnapshot, Signal } from '../../types';
import { isNearRoundNumber, isVolumeExhausted } from './utils';

/**
 * ESTRATÉGIA: FIBONACCI RETRACTION (M1)
 * Foco: Continuação de tendência após correção em níveis de ouro.
 * Ajuste: Adicionado filtro de taxas e volume.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];

    for (const asset in snapshot) {
        const candles = snapshot[asset];
        if (candles.length < 50) continue;

        // Busca o range maior (Impulso) nos últimos 40 candles
        const range = candles.slice(-45, -2);
        const high = Math.max(...range.map(c => c.high));
        const low = Math.min(...range.map(c => c.low));
        const diff = high - low;
        if (diff < 0.00020) continue;

        const current = candles[candles.length - 1];
        const volExhausted = isVolumeExhausted(candles);
        
        // Nível de 61.8% (O mais forte)
        const fib618Call = high - (diff * 0.618); // Para CALL (Correção de alta)
        const fib618Put = low + (diff * 0.618);   // Para PUT (Correção de baixa)
        
        const tolerance = diff * 0.08;

        // Tendência de ALTA -> Pullback no 61.8%
        const isUpTrend = candles[candles.length-10].close < candles[candles.length-2].close;
        if (isUpTrend && Math.abs(current.low - fib618Call) < tolerance) {
            const lowerWick = Math.min(current.open, current.close) - current.low;
            const nearTaxa = isNearRoundNumber(fib618Call);

            if (lowerWick > (Math.abs(current.close - current.open) * 0.5)) {
                let confidence = 88;
                if (nearTaxa) confidence += 5;
                if (volExhausted) confidence += 4;

                signals.push({ 
                    asset, 
                    direction: 'CALL', 
                    confidence: Math.min(confidence, 98), 
                    reason: `Retração Fibo 61.8%${nearTaxa ? ' + Taxa' : ''}`, 
                    strategyId: 'FIBONACCI_RETRACTION_M1', 
                    strategyName: 'Fibo Master', 
                    score: 0 
                });
            }
        }

        // Tendência de BAIXA -> Pullback no 61.8%
        const isDownTrend = candles[candles.length-10].close > candles[candles.length-2].close;
        if (isDownTrend && Math.abs(current.high - fib618Put) < tolerance) {
            const upperWick = current.high - Math.max(current.open, current.close);
            const nearTaxa = isNearRoundNumber(fib618Put);

            if (upperWick > (Math.abs(current.close - current.open) * 0.5)) {
                let confidence = 88;
                if (nearTaxa) confidence += 5;
                if (volExhausted) confidence += 4;

                signals.push({ 
                    asset, 
                    direction: 'PUT', 
                    confidence: Math.min(confidence, 98), 
                    reason: `Retração Fibo 61.8%${nearTaxa ? ' + Taxa' : ''}`, 
                    strategyId: 'FIBONACCI_RETRACTION_M1', 
                    strategyName: 'Fibo Master', 
                    score: 0 
                });
            }
        }
    }
    return signals;
};

export default {
    id: 'FIBONACCI_RETRACTION_M1',
    name: 'Fibonacci Master M1',
    description: 'Retração: Nível 61.8% após impulso de tendência. Gatilho de Rejeição.',
    marketType: 'BOTH',
    timeframe: 'M1',
    bypassGlobalFilters: true,
    analyze
};
