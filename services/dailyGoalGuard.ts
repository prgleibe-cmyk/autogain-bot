


import { DailyGoalConfig } from "../types";

/**
 * SERVIÇO: GUARDIÃO DA META DIÁRIA
 * Responsável por verificar isoladamente se o bot pode operar
 * baseando-se na meta de lucro diário e horário de retorno.
 */

export interface DailyGoalStatus {
    allowed: boolean;
    reason?: string;
    action?: 'RESET_SESSION' | 'HIBERNATE' | 'NONE';
}

export const dailyGoalGuard = {

    /**
     * Verifica se o bot pode operar.
     * @param profit Lucro atual da sessão
     * @param initialBalance Banca inicial (para cálculo de %)
     * @param config Configuração da Meta Diária
     * @param updateConfigCallback Callback para persistir a data de batimento da meta
     */
    check: (
        profit: number, 
        initialBalance: number,
        config: DailyGoalConfig, 
        updateConfigCallback: (newConfig: DailyGoalConfig) => void
    ): DailyGoalStatus => {
        
        // 1. Se desativado, permite tudo
        if (!config.enabled) {
            return { allowed: true, action: 'NONE' };
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const lastHitDate = config.lastGoalHitDate;
        
        // 2. Verificar se a meta já foi batida HOJE
        if (lastHitDate === todayStr) {
            return {
                allowed: false,
                reason: `Meta Diária atingida hoje (${todayStr}). Retorno apenas amanhã às ${config.returnTime}.`,
                action: 'HIBERNATE'
            };
        }

        // 3. Verificar se estamos em um NOVO DIA após ter batido a meta anteriormente
        if (lastHitDate && lastHitDate !== todayStr) {
            // Se a data do último hit é diferente de hoje, verificamos o horário
            const [returnHour, returnMinute] = config.returnTime.split(':').map(Number);
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            const isTimeReached = 
                currentHour > returnHour || 
                (currentHour === returnHour && currentMinute >= returnMinute);

            if (!isTimeReached) {
                return {
                    allowed: false,
                    reason: `Novo dia detectado, aguardando horário de retorno (${config.returnTime}).`,
                    action: 'HIBERNATE'
                };
            } else {
                // Chegou o horário! Precisamos liberar e resetar a sessão anterior
                // O check abaixo garante que só resetamos se o lucro ainda estiver alto (sessão antiga)
                // Precisamos recalcular o alvo aqui também para ser consistente
                let targetValue = config.goalValue;
                if (config.type === 'PERCENT' && initialBalance > 0) {
                    targetValue = initialBalance * (config.goalPercent / 100);
                }

                if (profit >= targetValue) {
                    return {
                        allowed: true,
                        reason: "Novo dia e horário atingido. Reiniciando sessão.",
                        action: 'RESET_SESSION'
                    };
                }
            }
        }

        // 4. Verificação de BATIMENTO DA META (Tempo Real)
        
        // Definição Dinâmica do Alvo (Valor ou Percentual)
        let targetValue = config.goalValue;
        let displayTarget = `$${targetValue.toFixed(2)}`;

        if (config.type === 'PERCENT') {
            if (initialBalance <= 0) {
                // Fail-safe: Se banca inicial for 0 (erro ou não conectado), usa o valor fixo como fallback
                // ou simplesmente assume que não dá pra calcular %.
                // Vamos usar goalValue como fallback silencioso.
                targetValue = config.goalValue; 
            } else {
                targetValue = initialBalance * (config.goalPercent / 100);
                displayTarget = `${config.goalPercent}% ($${targetValue.toFixed(2)})`;
            }
        }

        if (profit >= targetValue) {
            // Acabou de bater a meta!
            const newConfig = { ...config, lastGoalHitDate: todayStr };
            updateConfigCallback(newConfig);

            return {
                allowed: false,
                reason: `PARABÉNS! Meta Diária de ${displayTarget} atingida.`,
                action: 'HIBERNATE'
            };
        }

        // 5. Operação Normal
        return { allowed: true, action: 'NONE' };
    }
};
