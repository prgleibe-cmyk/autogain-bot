
import { MarketSnapshot, Signal } from '../../types';

/**
 * ESTRATÉGIA: MOMENTUM VOLUME (M1)
 * Foco: Explosão de volatilidade e volume indicando início de forte movimento.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];

    for (const asset in snapshot) {
        const candles = snapshot[asset];
        if (candles.length < 10) continue;

        // Analisa os últimos 3 candles fechados
        const c1 = candles[candles.length - 1]; // Atual
        const c2 = candles[candles.length - 2];
        const c3 = candles[candles.length - 3];

        const isGreen = (c: any) => c.close > c.open;
        const body = (c: any) => Math.abs(c.close - c.open);
        
        // Sequência de 3 candles da mesma cor
        const allGreen = isGreen(c1) && isGreen(c2) && isGreen(c3);
        const allRed = !isGreen(c1) && !isGreen(c2) && !isGreen(c3);

        if (!allGreen && !allRed) continue;

        // Volume crescente ou acima da média (simulado aqui como crescente nos últimos 3)
        const volIncreasing = (c1.volume || 0) > (c2.volume || 0) && (c2.volume || 0) >= (c3.volume || 0) * 0.9;
        // Corpos expansivos (Velas ficando maiores)
        const bodyExpanding = body(c1) > body(c2) * 0.8;

        if (volIncreasing && bodyExpanding) {
            signals.push({ 
                asset, 
                direction: allGreen ? 'CALL' : 'PUT', 
                confidence: 91, 
                reason: `Explosão de Momentum ${allGreen ? 'Alta' : 'Baixa'}`, 
                strategyId: 'MOMENTUM_VOLUME', 
                strategyName: 'Momentum Pro', 
                score: 0 
            });
        }
    }
    return signals;
};

export default {
    id: 'MOMENTUM_VOLUME',
    name: 'Explosão Momentum',
    description: 'Fluxo: Candles expansivos com volume crescente. Segue a força dominante.',
    marketType: 'OPEN',
    timeframe: 'M1',
    bypassGlobalFilters: true,
    analyze
};
