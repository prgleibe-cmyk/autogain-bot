import { MarketCandle } from "../types";

// --- MATEMÁTICA PURA (Substituindo NumPy) ---

export const calculateSMA = (data: number[], period: number): number => {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
};

export const calculateEMA = (data: number[], period: number): number[] => {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const emaArray = [data[0]]; // Começa com o primeiro preço como SMA inicial simples
  
  for (let i = 1; i < data.length; i++) {
    const val = (data[i] * k) + (emaArray[i - 1] * (1 - k));
    emaArray.push(val);
  }
  return emaArray;
};

export const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50.0;
  
  let gains = 0;
  let losses = 0;

  // Primeiro cálculo (SMA dos ganhos/perdas)
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Suavização Wilder (O padrão da IQ Option/Quotex)
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }

  if (avgLoss === 0) return 100.0;
  
  const rs = avgGain / avgLoss;
  return 100.0 - (100.0 / (1.0 + rs));
};

export const calculateBollingerBands = (closes: number[], period: number = 20, multiplier: number = 2.5): { upper: number, lower: number, middle: number } => {
    if (closes.length < period) return { upper: 0, lower: 0, middle: 0 };
    
    const slice = closes.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;
    
    // Desvio Padrão
    const squareDiffs = slice.map(value => Math.pow(value - middle, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(avgSquareDiff);

    return {
        middle,
        upper: middle + (stdDev * multiplier),
        lower: middle - (stdDev * multiplier)
    };
};

export const calculateAverageVolume = (candles: MarketCandle[], period: number = 10): number => {
  if (candles.length < period) return 0;
  const recent = candles.slice(-period);
  const sum = recent.reduce((acc, c) => acc + (c.volume || 0), 0);
  return sum / period;
};
export const calculateColorStreak = (candles: MarketCandle[]): { color: 'GREEN' | 'RED' | 'NONE', count: number } => {
    if (candles.length < 5) return { color: 'NONE', count: 0 };
    
    const history = candles.slice(0, candles.length - 1).reverse(); 
    
    if (history.length === 0) return { color: 'NONE', count: 0 };

    const firstIsGreen = history[0].close >= history[0].open;
    let count = 0;

    for (const c of history) {
        const isGreen = c.close >= c.open;
        if (isGreen === firstIsGreen) {
            count++;
        } else {
            break;
        }
    }

    return {
        color: firstIsGreen ? 'GREEN' : 'RED',
        count
    };
};