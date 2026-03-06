
import { MarketCandle, MarketType, MarketFilterSettings } from '../types';

const getCandleColor = (c: MarketCandle) => c.close >= c.open ? 'GREEN' : 'RED';
const getBodySize = (c: MarketCandle) => Math.abs(c.close - c.open);
const getTotalSize = (c: MarketCandle) => c.high - c.low;

const isDoji = (c: MarketCandle): boolean => {
    const total = getTotalSize(c);
    if (total === 0) return true;
    // Suavizado de 5% para 3% - torna o filtro de Doji menos chato
    return (getBodySize(c) / total) <= 0.03;
};

const checkTimeFilter = (marketType: MarketType): boolean => {
    const now = new Date();
    const hour = now.getUTCHours();
    if (marketType === MarketType.OPEN) {
        if (hour === 0 || hour >= 22) return false; 
    }
    return true;
};

const checkDojiFilter = (candles: MarketCandle[], maxDojis: number): boolean => {
    if (candles.length < 5) return true;
    const recent = candles.slice(-5);
    let dojiCount = 0;
    for (const c of recent) {
        if (isDoji(c)) dojiCount++;
    }
    return dojiCount < maxDojis;
};

const checkWickFilter = (candles: MarketCandle[], minPercent: number): boolean => {
    if (candles.length < 3) return true;
    const recent = candles.slice(-3);
    const hasReaction = recent.some(c => {
        const total = getTotalSize(c);
        if (total === 0) return false;
        const upper = c.high - Math.max(c.open, c.close);
        const lower = Math.min(c.open, c.close) - c.low;
        const maxWick = Math.max(upper, lower);
        return (maxWick / total) * 100 >= minPercent;
    });
    return hasReaction;
};

const checkDirectionFilter = (candles: MarketCandle[], direction: 'CALL' | 'PUT'): boolean => {
    if (candles.length < 8) return true;
    const lastColor = getCandleColor(candles[candles.length - 1]);
    let streak = 0;
    for (let i = candles.length - 1; i >= 0; i--) {
        if (getCandleColor(candles[i]) === lastColor) streak++;
        else break;
    }
    const isCounter = (lastColor === 'GREEN' && direction === 'PUT') || (lastColor === 'RED' && direction === 'CALL');
    if (streak >= 7 && isCounter) return false;
    return true;
};

const checkContextFilter = (candles: MarketCandle[], minRange: number): boolean => {
    if (candles.length < 5) return true;
    const recent = candles.slice(-5);
    let totalRange = 0;
    for(const c of recent) {
        totalRange += (c.high - c.low);
    }
    return totalRange >= minRange; 
};

export const canEnterTradeGlobal = (
    candles: MarketCandle[], 
    marketType: MarketType,
    direction: 'CALL' | 'PUT',
    settings: MarketFilterSettings
): { allowed: boolean, reason?: string } => {
    
    if (!settings) return { allowed: true };

    if (settings.timeFilter && !checkTimeFilter(marketType)) {
        return { allowed: false, reason: "Horário Restrito" };
    }

    if (settings.contextFilter && !checkContextFilter(candles, settings.minRangeSize || 0.00003)) {
        return { allowed: false, reason: "Baixa Volatilidade" };
    }

    if (settings.dojiFilter && !checkDojiFilter(candles, settings.maxDojiCount || 4)) {
        return { allowed: false, reason: "Muitos Dojis" };
    }
    
    if (settings.wickFilter && !checkWickFilter(candles, settings.minWickPercent || 3)) {
        return { allowed: false, reason: "Sem Pavio/Rejeição" };
    }

    if (settings.directionFilter && !checkDirectionFilter(candles, direction)) {
        return { allowed: false, reason: "Tendência Forte Oposta" };
    }
    
    return { allowed: true };
};
