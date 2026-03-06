import { SystemSettings, RiskMode } from '../../types';

/**
 * RISK ENGINE v5.0 (STABLE PRODUCTION)
 * Motor central de inteligência financeira.
 * Garante uso REAL das configurações do painel.
 */
export class RiskEngine {

    static CICLO_MULTIPLIERS = [1, 2.25, 5.1, 11.5, 26, 58, 131, 295, 664, 1495];

    static calculateEntry(
        balance: number,
        initialBalance: number,
        settings: SystemSettings,
        stats: {
            consecutiveLosses: number;
            consecutiveWins: number;
            cycleProfitPile: number;
            currentCycleStep: number;
        },
        strategyId?: string
    ): number {
        // Garantia de valores numéricos e seguros
        const safeBalance = Math.max(0, Number(balance) || 0);
        const minBrokerAmount = 1.0; // Valor mínimo aceito pela maioria das corretoras

        // ==========================================
        // 1️⃣ DETERMINAÇÃO DO VALOR BASE DE ENTRADA
        // ==========================================
        
        let entryMode: 'PERCENT' | 'FIXED' = settings.entryType;
        let entryFixed = Number(settings.entryFixedValue) || 0;
        let entryPercent = Number(settings.entryPercent) || 0;

        // Sobrescrita por estratégia se configurado no Admin
        if (settings.entryManagementMode === 'STRATEGY' && strategyId) {
            const custom = settings.strategyCustomConfigs?.[strategyId];
            if (custom) {
                if (custom.entryType) entryMode = custom.entryType;
                if (custom.entryValue !== undefined) {
                    if (entryMode === 'FIXED') entryFixed = Number(custom.entryValue);
                    else entryPercent = Number(custom.entryValue);
                }
            }
        }

        let baseAmount = 0;
        if (entryMode === 'FIXED') {
            baseAmount = entryFixed;
        } else {
            // PERCENTUAL SEMPRE SOBRE O SALDO ATUAL (Requisito do Usuário)
            baseAmount = safeBalance * (entryPercent / 100);
        }

        // Proteção contra valores inválidos
        if (!isFinite(baseAmount) || isNaN(baseAmount) || baseAmount < minBrokerAmount) {
            baseAmount = Math.min(safeBalance, minBrokerAmount);
        }

        let calculatedAmount = baseAmount;

        // ==========================================
        // 2️⃣ APLICAÇÃO DO MODO DE GERENCIAMENTO
        // ==========================================

        console.log(`[RiskEngine] Calculando para Modo: ${settings.riskMode} | Base: ${baseAmount}`);

        switch (settings.riskMode) {
            case RiskMode.FIXED:
                // MÃO FIXA: Mantém o valor base calculado
                calculatedAmount = baseAmount;
                break;

            case RiskMode.MARTINGALE:
                // MARTINGALE: Multiplica após LOSS
                if (stats.consecutiveLosses > 0 && stats.consecutiveLosses <= (settings.maxMartingaleLevels || 0)) {
                    calculatedAmount = baseAmount * Math.pow(Number(settings.martingaleMultiplier) || 1, stats.consecutiveLosses);
                } else {
                    calculatedAmount = baseAmount;
                }
                break;

            case RiskMode.SOROS:
                // SOROS: Acumula lucro após WIN
                if (stats.consecutiveWins > 0 && stats.consecutiveWins < (settings.sorosLevels || 0)) {
                    // Soma o lucro acumulado da sequência atual ao valor base
                    calculatedAmount = baseAmount + (Number(stats.cycleProfitPile) || 0);
                } else {
                    calculatedAmount = baseAmount;
                }
                break;

            case RiskMode.SOROS_GALE:
                // SOROSGALE: Híbrido
                if (stats.consecutiveLosses > 0 && stats.consecutiveLosses <= (settings.maxMartingaleLevels || 0)) {
                    calculatedAmount = baseAmount * Math.pow(Number(settings.martingaleMultiplier) || 1, stats.consecutiveLosses);
                } else if (stats.consecutiveWins > 0 && stats.consecutiveWins < (settings.sorosLevels || 0)) {
                    calculatedAmount = baseAmount + (Number(stats.cycleProfitPile) || 0);
                } else {
                    calculatedAmount = baseAmount;
                }
                break;

            case RiskMode.MASANIELO:
                // MASANIELO: Progressão geométrica suave
                if (stats.consecutiveWins > 0) {
                    calculatedAmount = baseAmount * Math.pow(Number(settings.masanieloFactor) || 1.4, stats.consecutiveWins);
                } else {
                    calculatedAmount = baseAmount;
                }
                break;

            case RiskMode.CICLO_3_10:
                // CICLO: Baseado em tabela de multiplicadores
                const step = Math.min(stats.consecutiveLosses, this.CICLO_MULTIPLIERS.length - 1);
                const multiplier = this.CICLO_MULTIPLIERS[step];
                
                // CORREÇÃO: Se o modo do ciclo for FIXED mas o valor for o padrão (2.0), 
                // usamos o entryFixed definido pelo usuário para maior consistência.
                let cycleBase = entryFixed;
                if (settings.ciclo310Mode === 'FIXED' && settings.ciclo310FixedValue && settings.ciclo310FixedValue !== 2.0) {
                    cycleBase = Number(settings.ciclo310FixedValue);
                } else if (settings.ciclo310Mode === 'PERCENT') {
                    cycleBase = baseAmount;
                }

                calculatedAmount = cycleBase * multiplier;
                console.log(`[RiskEngine] Ciclo Step: ${step} | Multiplier: ${multiplier} | Base: ${cycleBase}`);
                break;

            default:
                calculatedAmount = baseAmount;
        }

        // ==========================================
        // 3️⃣ TRAVAS DE SEGURANÇA FINAIS
        // ==========================================
        
        let finalAmount = calculatedAmount;

        // Nunca exceder o saldo atual
        if (finalAmount > safeBalance) {
            finalAmount = safeBalance;
        }

        // Garantir valor mínimo da corretora
        if (finalAmount < minBrokerAmount && safeBalance >= minBrokerAmount) {
            finalAmount = minBrokerAmount;
        }

        // Fallback final para sanidade
        if (!isFinite(finalAmount) || isNaN(finalAmount)) {
            finalAmount = minBrokerAmount;
        }

        return parseFloat(finalAmount.toFixed(2));
    }
}
