import { TimezoneRule, TimezoneColor } from '../types';
import { DEFAULT_SYSTEM_SETTINGS } from '../constants';

/**
 * SERVIÇO DE TIMEZONE MAP
 * Responsável por gerenciar regras de bloqueio baseadas no mapa de cores.
 * 
 * Este serviço atua como uma camada isolada. Se as regras não estiverem ativas,
 * ele sempre retorna que a operação é permitida.
 */

export const timezoneService = {
    
    /**
     * Retorna as regras padrão caso não estejam configuradas
     */
    getDefaultRules: (): TimezoneRule[] => {
        return DEFAULT_SYSTEM_SETTINGS.timezoneRules;
    },

    /**
     * Valida e higieniza uma regra antes de salvar.
     * Garante que não existam tempos negativos.
     */
    validateRule: (rule: TimezoneRule): TimezoneRule => {
        return {
            ...rule,
            blockMinutesBefore: Math.max(0, rule.blockMinutesBefore),
            blockMinutesAfter: Math.max(0, rule.blockMinutesAfter)
        };
    },

    /**
     * Ordena as regras por prioridade (Melhor para Pior).
     */
    sortRules: (rules: TimezoneRule[]): TimezoneRule[] => {
        return [...rules].sort((a, b) => a.priority - b.priority);
    },

    /**
     * Verifica se existe alguma regra ativa de bloqueio.
     * Esta função é a única que o Bot precisa consultar futuramente.
     * 
     * @param rules Lista de regras configuradas no SystemSettings
     * @param currentColor A cor atual do mercado (viria de uma API externa ou input manual)
     * @returns { allowed: boolean, reason?: string }
     */
    checkTimezoneBlock: (rules: TimezoneRule[], currentColor: TimezoneColor): { allowed: boolean, reason?: string } => {
        // Se a lista de regras estiver vazia ou inválida, permite operar (fail-safe)
        if (!rules || !Array.isArray(rules)) {
            return { allowed: true };
        }

        const activeRules = rules.filter(r => r.active);
        
        // Se nenhuma regra estiver ativa, o sistema de Timezone Map está "Desligado"
        if (activeRules.length === 0) {
            return { allowed: true };
        }

        const ruleForColor = activeRules.find(r => r.color === currentColor);

        // Se existir uma regra ATIVA para a cor atual, significa que devemos verificar bloqueio
        if (ruleForColor) {
            // Se a regra está ativa, e a cor atual corresponde, BLOQUEIA.
            // A lógica de "Antes" e "Depois" dependeria de saber o horário de transição da cor.
            // Como neste MVP estamos apenas definindo a estrutura, assumimos que se a cor ATUAL
            // está marcada como ativa para bloqueio, paramos.
            
            // Lógica futura: Integrar com horário real para usar blockMinutesBefore/After.
            // Por enquanto, o bloqueio é binário baseada na cor ativa.
            
            return { 
                allowed: false, 
                reason: `Bloqueio Timezone: ${ruleForColor.label}` 
            };
        }

        return { allowed: true };
    }
};