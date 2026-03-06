
import { MarketSnapshot, Signal } from '../../types';
import { isNearRoundNumber } from './utils';

/**
 * ESTRATÉGIA: PRICE ACTION PATTERNS (M1)
 * Foco: Reversão em Engolfo e Pin Bars (Martelo/Estrela) com volume.
 * Ajuste: Adicionado filtro de taxas para Pin Bars.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];

    for (const asset in snapshot) {
        const candles = snapshot[asset];
        if (candles.length < 20) continue;

        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2];
        
        const lastBody = Math.abs(last.close - last.open);
        const prevBody = Math.abs(prev.close - prev.open);
        const lastTotal = last.high - last.low;
        
        // 1. ENGOLFO DE ALTA
        if (last.close > last.open && prev.close < prev.open && last.close > prev.open && last.open < prev.close) {
            if ((last.volume || 0) > (prev.volume || 0)) {
                signals.push({ 
                    asset, 
                    direction: 'CALL', 
                    confidence: 92, 
                    reason: 'Engolfo de Alta + Volume', 
                    strategyId: 'PATTERN_VOLUME_M1', 
                    strategyName: 'PA Patterns', 
                    score: 0 
                });
                continue;
            }
        }
        
        // 2. ENGOLFO DE BAIXA
        if (last.close < last.open && prev.close > prev.open && last.close < prev.open && last.open > prev.close) {
            if ((last.volume || 0) > (prev.volume || 0)) {
                signals.push({ 
                    asset, 
                    direction: 'PUT', 
                    confidence: 92, 
                    reason: 'Engolfo de Baixa + Volume', 
                    strategyId: 'PATTERN_VOLUME_M1', 
                    strategyName: 'PA Patterns', 
                    score: 0 
                });
                continue;
            }
        }

        // 3. PIN BAR (Martelo / Shooting Star)
        if (lastTotal > 0) {
            const upperWick = last.high - Math.max(last.open, last.close);
            const lowerWick = Math.min(last.open, last.close) - last.low;
            const nearTaxa = isNearRoundNumber(last.close);
            
            // Martelo (Alta)
            if (lowerWick > lastBody * 2 && upperWick < lastBody * 0.5) {
                let confidence = 89;
                if (nearTaxa) confidence += 5;
                signals.push({ 
                    asset, 
                    direction: 'CALL', 
                    confidence: Math.min(confidence, 98), 
                    reason: `Pin Bar (Hammer)${nearTaxa ? ' em Taxa' : ''}`, 
                    strategyId: 'PATTERN_VOLUME_M1', 
                    strategyName: 'PA Patterns', 
                    score: 0 
                });
            }
            // Estrela Cadente (Baixa)
            else if (upperWick > lastBody * 2 && lowerWick < lastBody * 0.5) {
                let confidence = 89;
                if (nearTaxa) confidence += 5;
                signals.push({ 
                    asset, 
                    direction: 'PUT', 
                    confidence: Math.min(confidence, 98), 
                    reason: `Pin Bar (Star)${nearTaxa ? ' em Taxa' : ''}`, 
                    strategyId: 'PATTERN_VOLUME_M1', 
                    strategyName: 'PA Patterns', 
                    score: 0 
                });
            }
        }
    }
    return signals;
};

export default {
    id: 'PATTERN_VOLUME_M1',
    name: 'Price Action Padrões M1',
    description: 'Reversão: Engolfo e Pin Bars confirmados por Volume e Rejeição.',
    marketType: 'BOTH',
    timeframe: 'M1',
    bypassGlobalFilters: true,
    analyze
};
