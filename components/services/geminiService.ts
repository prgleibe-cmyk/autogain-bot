
import { GoogleGenAI, Type } from "@google/genai";
import { MarketCandle, MarketType, AnalysisResult, StrategyDefinition, StrategyPerformance, MarketSnapshot } from "../types";
import { canEnterTradeGlobal } from "./globalMarketFilters";
import { STRATEGY_REGISTRY } from "./strategyRegistry";

// Adaptador para scanners de estratégias
const adaptScanner = (scanner: (snapshot: MarketSnapshot) => any[]) => {
    return (candles: MarketCandle[]) => {
        const snapshot: MarketSnapshot = { 'TEMP_ASSET': candles };
        const signals = scanner(snapshot);
        if (signals && signals.length > 0) {
            const s = signals[0];
            return {
                direction: s.direction,
                confidence: s.confidence,
                reason: s.reason
            };
        }
        return null;
    };
};

export const validateSignalWithAI = async (
  candles: MarketCandle[],
  signal: AnalysisResult
): Promise<{ confirm: boolean; reason: string }> => {
  // Inicialização obrigatória dentro da função para garantir chave atualizada
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const lastCloses = candles.slice(-15).map(c => c.close).join(', ');
  
  const prompt = `
    ATUAÇÃO: Especialista em Opções Binárias M1.
    SINAL MATEMÁTICO: Estratégia "${signal.strategyName}" detectou "${signal.direction}".
    ÚLTIMOS FECHAMENTOS: [${lastCloses}]
    
    TAREFA: Analise o momentum e confirme se a entrada é de alta probabilidade.
    RESPONDA APENAS EM JSON: { "confirm": boolean, "reason": "string de 3 palavras" }
  `;

  try {
      const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: {
              thinkingConfig: { thinkingBudget: 2000 },
              responseMimeType: 'application/json',
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      confirm: { type: Type.BOOLEAN },
                      reason: { type: Type.STRING }
                  },
                  required: ['confirm', 'reason']
              }
          }
      });

      // Acesso direto à propriedade .text (conforme diretrizes)
      const result = JSON.parse(response.text || '{"confirm": true, "reason": "Erro na análise"}');
      return result;
  } catch (error) {
      console.warn("[AI Validation] Skipped due to error:", error);
      return { confirm: true, reason: "Execução Técnica" };
  }
};

export const analyzeMarket = async (
  candles: MarketCandle[], 
  marketType: MarketType,
  availableStrategies: StrategyDefinition[],
  strategyStats?: Record<string, StrategyPerformance>
): Promise<AnalysisResult> => {
    const activeStrategies = availableStrategies.filter(s => {
        if (s.id === 'TEST_HIGH_FREQ') return false; 
        if (s.marketType === 'BOTH') return true;
        return (marketType === MarketType.OTC && s.marketType === 'OTC') || 
               (marketType === MarketType.OPEN && s.marketType === 'OPEN');
    });

    if (activeStrategies.length === 0) {
        return { direction: 'HOLD', confidence: 0, reason: "Sem estratégias compatíveis.", strategyId: "NONE", strategyName: "Nenhuma" };
    }

    const results = activeStrategies.map(strat => {
        const strategyModule = STRATEGY_REGISTRY[strat.id];
        if (!strategyModule) return null;
        
        const analyzeFn = adaptScanner(strategyModule.analyze);
        const result = analyzeFn(candles);
        return result ? { ...result, strategyId: strat.id, strategyName: strat.name } : null;
    }).filter(r => r !== null) as (AnalysisResult & { confidence: number })[];

    if (results.length === 0) {
        return { direction: 'HOLD', confidence: 0, reason: "Aguardando setup matemático...", strategyId: "NONE", strategyName: "Nenhuma" };
    }

    // Ordenação por confiança ponderada por estatísticas reais
    results.sort((a, b) => {
        const statA = strategyStats?.[a.strategyId] ? (strategyStats[a.strategyId].wins - strategyStats[a.strategyId].losses) : 0;
        const statB = strategyStats?.[b.strategyId] ? (strategyStats[b.strategyId].wins - strategyStats[b.strategyId].losses) : 0;
        return (b.confidence + statB) - (a.confidence + statA);
    });

    const bestSignal = results[0];
    return bestSignal;
};
