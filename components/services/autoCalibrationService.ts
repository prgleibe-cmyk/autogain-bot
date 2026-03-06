import { MarketCandle, MarketFilterSettings } from "../types";

/**
 * SERVIÇO: AUTO-CALIBRAGEM IA
 * 
 * Analisa o histórico recente do mercado (últimas 100 velas) e ajusta
 * os filtros globais para se adaptar à volatilidade e ruído atuais.
 */

export const autoCalibrationService = {
    
    /**
     * Calcula os novos parâmetros de filtro baseados no comportamento do mercado.
     * @param candles Histórico de velas (idealmente > 50)
     * @param currentSettings Configurações atuais (para manter flags booleanas)
     */
    calculateDynamicFilters: (
        candles: MarketCandle[], 
        currentSettings: MarketFilterSettings
    ): MarketFilterSettings => {
        
        // Se não houver dados suficientes, retorna o padrão seguro
        if (!candles || candles.length < 50) {
            return currentSettings;
        }

        const recent = candles.slice(-50); // Analisa últimos 50 min

        // 1. ANÁLISE DE VOLATILIDADE (Range Médio)
        const ranges = recent.map(c => c.high - c.low);
        const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
        
        // Ajuste dinâmico do Range Mínimo (Context Filter)
        // O checkContextFilter soma as últimas 5 velas. 
        // Queremos que a soma das últimas 5 seja pelo menos 1.5x a média de uma vela normal.
        // Se o mercado "morreu" recentemente, a soma das 5 será menor que isso.
        const dynamicMinRange = parseFloat((avgRange * 1.5).toFixed(5));

        // 2. ANÁLISE DE RUÍDO (Dojis)
        const dojis = recent.filter(c => {
            const body = Math.abs(c.close - c.open);
            const total = c.high - c.low;
            return total > 0 && (body / total) < 0.1; // Doji estrito
        });
        const dojiDensity = dojis.length / recent.length; // Ex: 0.2 = 20% das velas são dojis

        // Ajuste dinâmico de Max Dojis
        // Se a densidade de Doji for alta (>15%), o mercado está indeciso/lateral.
        // Nesse caso, apertamos o filtro (menos dojis permitidos em sequencia).
        // Se for baixa, relaxamos.
        let dynamicMaxDoji = 4;
        if (dojiDensity > 0.20) dynamicMaxDoji = 2; // Muito ruído -> Rigoroso
        else if (dojiDensity > 0.10) dynamicMaxDoji = 3; // Ruído médio
        else dynamicMaxDoji = 5; // Mercado limpo -> Tolerante

        // 3. ANÁLISE DE PAVIO (Rejeição Média)
        // Calcula a média de pavio percentual das últimas velas
        const wickPercents = recent.map(c => {
            const total = c.high - c.low;
            if (total === 0) return 0;
            const upper = c.high - Math.max(c.open, c.close);
            const lower = Math.min(c.open, c.close) - c.low;
            const maxWick = Math.max(upper, lower);
            return (maxWick / total) * 100;
        });
        const avgWickPercent = wickPercents.reduce((a, b) => a + b, 0) / wickPercents.length;

        // Ajuste dinâmico do Pavio Mínimo
        // O filtro deve exigir um pouco menos que a média para ser saudável.
        // Ex: Se a média é 20% de pavio, exigimos 10%.
        let dynamicMinWick = Math.floor(avgWickPercent * 0.5); 
        dynamicMinWick = Math.max(2, Math.min(15, dynamicMinWick)); // Clamp entre 2% e 15%

        console.log(`[AutoCalibration] Range: ${dynamicMinRange} | Doji: ${dynamicMaxDoji} | Wick: ${dynamicMinWick}%`);

        return {
            ...currentSettings,
            // Quando a auto-calibragem está ativa, ela assume o controle desses filtros específicos
            contextFilter: true,
            dojiFilter: true,
            wickFilter: true,
            minRangeSize: dynamicMinRange,
            maxDojiCount: dynamicMaxDoji,
            minWickPercent: dynamicMinWick
        };
    }
};