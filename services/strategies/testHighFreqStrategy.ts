
import { MarketSnapshot, Signal } from '../../types';

/**
 * ESTRATÉGIA: TEST_HIGH_FREQ (MODO TESTE ESTRUTURAL)
 * Objetivo: Validar o pipeline de execução sem spammar o socket.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];
    const assetKeys = Object.keys(snapshot);
    
    // Analisa todos os ativos para aumentar chance de sinal no modo teste
    for (const asset of assetKeys) {
        const candles = snapshot[asset];

        if (candles && candles.length >= 5) {
            // Probabilidade aumentada para 15% por ativo para facilitar o debug visual
            if (Math.random() > 0.85) {
                signals.push({
                    asset: asset,
                    direction: Math.random() > 0.5 ? 'CALL' : 'PUT',
                    confidence: 99,
                    reason: 'Sinal de Teste Forçado (Debug)',
                    strategyId: 'TEST_HIGH_FREQ',
                    strategyName: 'Sniper Test',
                    score: 0
                });
            }
        }
    }

    return signals;
};

export default {
    id: 'TEST_HIGH_FREQ',
    name: 'Modo Teste Estrutural',
    description: 'Estratégia para teste estrutural do motor.',
    marketType: 'BOTH',
    timeframe: 'M1',
    bypassGlobalFilters: true,
    analyze
};
