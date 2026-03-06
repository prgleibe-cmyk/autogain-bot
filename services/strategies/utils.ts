
/**
 * Verifica se o preço está próximo de uma "taxa" (número redondo).
 * Taxas de 00, 50, 000 são pontos psicológicos fortes de retração/reversão.
 */
export const isNearRoundNumber = (price: number, tolerance: number = 0.00005): boolean => {
    const priceStr = price.toFixed(5);
    const lastThree = priceStr.slice(-3);
    const lastTwo = priceStr.slice(-2);
    
    // Verifica finais 000, 00, 50
    const isRound = lastThree === '000' || lastTwo === '00' || lastTwo === '50';
    
    if (isRound) return true;
    
    // Verifica proximidade
    const decimals = price % 1;
    const points = Math.round(decimals * 100000);
    
    return (points % 50 <= tolerance * 100000) || (points % 50 >= 50 - (tolerance * 100000));
};

/**
 * Calcula a força do pavio (rejeição) em relação ao corpo da vela.
 */
export const getWickRejection = (candle: { open: number, close: number, high: number, low: number }, direction: 'CALL' | 'PUT'): number => {
    const body = Math.abs(candle.close - candle.open);
    if (body === 0) return 1; // Doji tem rejeição máxima proporcional
    
    if (direction === 'CALL') {
        // Rejeição de baixa (pavio inferior)
        const lowerWick = Math.min(candle.open, candle.close) - candle.low;
        return lowerWick / body;
    } else {
        // Rejeição de alta (pavio superior)
        const upperWick = candle.high - Math.max(candle.open, candle.close);
        return upperWick / body;
    }
};

/**
 * Verifica exaustão de volume (se disponível).
 */
export const isVolumeExhausted = (candles: any[], period: number = 5): boolean => {
    if (candles.length < period + 1) return false;
    const last = candles[candles.length - 1];
    if (!last.volume) return false;
    
    const avgVolume = candles.slice(-period - 1, -1).reduce((acc, c) => acc + (c.volume || 0), 0) / period;
    return last.volume > avgVolume * 1.5; // Volume 50% acima da média indica exaustão/clímax
};
