
import { MarketSnapshot, Signal } from '../../types';
import { calculateRSI } from '../indicators';

/**
 * ESTRATÉGIA: RSI DIVERGENCE (M1)
 * Foco: Quando o preço faz novos picos/vales mas o RSI não acompanha, indicando perda de força.
 */
const analyze = (snapshot: MarketSnapshot): Signal[] => {
    const signals: Signal[] = [];

    for (const asset in snapshot) {
        const candles = snapshot[asset];
        if (candles.length < 40) continue;

        const closes = candles.map(c => c.close);
        const rsiValues = [];
        // Calcula RSI para os últimos 15 candles para detectar divergência
        for (let i = 15; i >= 0; i--) {
            rsiValues.push(calculateRSI(closes.slice(0, closes.length - i), 14));
        }
        
        const lastCandle = candles[candles.length - 1];
        const prevPeakCandle = candles[candles.length - 10]; // Ponto de referência anterior
        
        const lastRsi = rsiValues[rsiValues.length - 1];
        const prevRsi = rsiValues[rsiValues.length - 10];

        // 1. DIVERGÊNCIA DE BAIXA (Venda)
        // Preço fez topo maior, RSI fez topo menor
        if (lastCandle.high > prevPeakCandle.high && lastRsi < prevRsi && lastRsi > 60) {
            signals.push({ 
                asset, 
                direction: 'PUT', 
                confidence: 87, 
                reason: 'Divergência de Baixa Preço vs RSI', 
                strategyId: 'RSI_DIVERGENCE_M1', 
                strategyName: 'RSI Div Pro', 
                score: 0 
            });
        }
        
        // 2. DIVERGÊNCIA DE ALTA (Compra)
        // Preço fez fundo menor, RSI fez fundo maior
        else if (lastCandle.low < prevPeakCandle.low && lastRsi > prevRsi && lastRsi < 40) {
            signals.push({ 
                asset, 
                direction: 'CALL', 
                confidence: 87, 
                reason: 'Divergência de Alta Preço vs RSI', 
                strategyId: 'RSI_DIVERGENCE_M1', 
                strategyName: 'RSI Div Pro', 
                score: 0 
            });
        }
    }
    return signals;
};

export default {
    id: 'RSI_DIVERGENCE_M1',
    name: 'RSI Divergence Pro',
    description: 'Técnica Avançada: Divergência entre Preço e RSI. Detecta fraqueza na tendência.',
    marketType: 'BOTH',
    timeframe: 'M1',
    bypassGlobalFilters: true,
    analyze
};
