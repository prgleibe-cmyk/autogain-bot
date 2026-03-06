
import type { MarketSnapshot, Signal } from '../../types';
import { isNearRoundNumber, isVolumeExhausted } from './utils';

/**
 * ESTRATÉGIA: FAKEOUT (FALSO ROMPIMENTO)
 * Foco: Reversão em S/R após rompimento sem volume/força.
 * Ajuste: Adicionado filtro de taxas e volume.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];

    for (const asset in snapshot) {
        const candles = snapshot[asset];
        if (candles.length < 40) continue;

        // Identificar S/R nos últimos 30 candles
        const lookback = 30;
        const rangeCandles = candles.slice(-lookback - 2, -2);
        const resistance = Math.max(...rangeCandles.map(c => c.high));
        const support = Math.min(...rangeCandles.map(c => c.low));

        const last = candles[candles.length - 1]; // Vela atual/fechando
        const prev = candles[candles.length - 2]; // Vela anterior

        const volExhausted = isVolumeExhausted(candles);
        const nearTaxaRes = isNearRoundNumber(resistance);
        const nearTaxaSup = isNearRoundNumber(support);

        // BULL TRAP (Fakeout na Resistência)
        const piercedRes = prev.high > resistance && prev.close <= resistance + (resistance * 0.0001);
        const rejectionRes = last.high > resistance && last.close < resistance;

        if (piercedRes || rejectionRes) {
            const body = Math.abs(last.close - last.open);
            const upperWick = last.high - Math.max(last.open, last.close);
            
            if (upperWick > body * 0.8) {
                let confidence = 90;
                if (nearTaxaRes) confidence += 4;
                if (volExhausted) confidence += 4;

                signals.push({ 
                    asset, 
                    direction: 'PUT', 
                    confidence: Math.min(confidence, 98), 
                    reason: `Bull Trap: Rejeição em Resistência${nearTaxaRes ? ' + Taxa' : ''}`, 
                    strategyId: 'FALSE_BREAKOUT_M1', 
                    strategyName: 'Fakeout S/R', 
                    score: 0 
                });
            }
        }

        // BEAR TRAP (Fakeout no Suporte)
        const piercedSup = prev.low < support && prev.close >= support - (support * 0.0001);
        const rejectionSup = last.low < support && last.close > support;

        if (piercedSup || rejectionSup) {
            const body = Math.abs(last.close - last.open);
            const lowerWick = Math.min(last.open, last.close) - last.low;

            if (lowerWick > body * 0.8) {
                let confidence = 90;
                if (nearTaxaSup) confidence += 4;
                if (volExhausted) confidence += 4;

                signals.push({ 
                    asset, 
                    direction: 'CALL', 
                    confidence: Math.min(confidence, 98), 
                    reason: `Bear Trap: Rejeição em Suporte${nearTaxaSup ? ' + Taxa' : ''}`, 
                    strategyId: 'FALSE_BREAKOUT_M1', 
                    strategyName: 'Fakeout S/R', 
                    score: 0 
                });
            }
        }
    }
    return signals;
};

export default {
    id: 'FALSE_BREAKOUT_M1',
    name: 'Falso Rompimento (Fakeout)',
    description: 'Contra-Tendência: Detecta armadilhas (Bull/Bear Traps) em S/R locais. Entra na rejeição.',
    marketType: 'BOTH',
    timeframe: 'M1',
    bypassGlobalFilters: true,
    analyze
};
