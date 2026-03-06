
import { MarketSnapshot, Signal } from '../../types';

/**
 * ESTRATÉGIA: TEST_HIGH_FREQ (MODO TESTE ESTRUTURAL)
 * Objetivo: Validar o pipeline de execução sem spammar o socket.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];
    const assetKeys = Object.keys(snapshot);
    
    // Escolhe apenas 1 ativo para testar a estabilidade da fila
    if (assetKeys.length > 0) {
        const randomAsset = assetKeys[Math.floor(Math.random() * assetKeys.length)];
        const candles = snapshot[randomAsset];

        if (candles && candles.length >= 5) {
            // Gera um sinal com probabilidade baixa para permitir ver o bot "pensando"
            if (Math.random() > 0.92) {
                signals.push({
                    asset: randomAsset,
                    direction: Math.random() > 0.5 ? 'CALL' : 'PUT',
                    confidence: 95,
                    reason: 'Sinal de Teste Controlado',
                    strategyId: 'TEST_HIGH_FREQ',
                    strategyName: 'Teste Sniper',
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
