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

        console.log(`[RiskEngine] 📊 INICIANDO CÁLCULO DE STAKE`);
        console.log(`[RiskEngine] Modo Ativo: ${settings.riskMode}`);
        console.log(`[RiskEngine] Saldo Atual: ${safeBalance.toFixed(2)}`);
        console.log(`[RiskEngine] Valor Base (antes do gerenciamento): ${baseAmount.toFixed(2)}`);
        console.log(`[RiskEngine] Stats Recebidos:`, stats);

        switch (settings.riskMode) {
            case RiskMode.FIXED:
                calculatedAmount = baseAmount;
                break;

            case RiskMode.MARTINGALE:
                const maxLevels = Number(settings.maxMartingaleLevels) || 0;
                if (stats.consecutiveLosses > 0 && stats.consecutiveLosses <= maxLevels) {
                    const multiplier = Number(settings.martingaleMultiplier) || 2;
                    calculatedAmount = baseAmount * Math.pow(multiplier, stats.consecutiveLosses);
                    console.log(`[RiskEngine] Martingale Aplicado: Nível ${stats.consecutiveLosses} | Multiplicador: ${multiplier} | Max Níveis: ${maxLevels} | Nova Stake: ${calculatedAmount.toFixed(2)}`);
                } else {
                    calculatedAmount = baseAmount;
                    if (stats.consecutiveLosses > 0) {
                        console.log(`[RiskEngine] Martingale NÃO Aplicado: Nível ${stats.consecutiveLosses} | Max Níveis: ${maxLevels}`);
                    }
                }
                break;

            case RiskMode.SOROS:
                if (stats.consecutiveWins > 0 && stats.consecutiveWins < (settings.sorosLevels || 0)) {
                    calculatedAmount = baseAmount + (Number(stats.cycleProfitPile) || 0);
                    console.log(`[RiskEngine] Soros Aplicado: Nível ${stats.consecutiveWins} | Lucro Acumulado: ${stats.cycleProfitPile.toFixed(2)} | Nova Stake: ${calculatedAmount.toFixed(2)}`);
                } else {
                    calculatedAmount = baseAmount;
                }
                break;

            case RiskMode.SOROS_GALE:
                if (stats.consecutiveLosses > 0 && stats.consecutiveLosses <= (settings.maxMartingaleLevels || 0)) {
                    const multiplier = Number(settings.martingaleMultiplier) || 2;
                    calculatedAmount = baseAmount * Math.pow(multiplier, stats.consecutiveLosses);
                    console.log(`[RiskEngine] SorosGale (Martingale) Aplicado: Nível ${stats.consecutiveLosses} | Nova Stake: ${calculatedAmount.toFixed(2)}`);
                } else if (stats.consecutiveWins > 0 && stats.consecutiveWins < (settings.sorosLevels || 0)) {
                    calculatedAmount = baseAmount + (Number(stats.cycleProfitPile) || 0);
                    console.log(`[RiskEngine] SorosGale (Soros) Aplicado: Nível ${stats.consecutiveWins} | Nova Stake: ${calculatedAmount.toFixed(2)}`);
                } else {
                    calculatedAmount = baseAmount;
                }
                break;

            case RiskMode.MASANIELO:
                if (stats.consecutiveWins > 0) {
                    const factor = Number(settings.masanieloFactor) || 1.4;
                    calculatedAmount = baseAmount * Math.pow(factor, stats.consecutiveWins);
                    console.log(`[RiskEngine] Masanielo Aplicado: Wins ${stats.consecutiveWins} | Fator: ${factor} | Nova Stake: ${calculatedAmount.toFixed(2)}`);
                } else {
                    calculatedAmount = baseAmount;
                }
                break;

            case RiskMode.CICLO_3_10:
                const step = Math.min(stats.consecutiveLosses, this.CICLO_MULTIPLIERS.length - 1);
                const multiplier = this.CICLO_MULTIPLIERS[step];
                let cycleBase = entryFixed;
                if (settings.ciclo310Mode === 'FIXED' && settings.ciclo310FixedValue && settings.ciclo310FixedValue !== 2.0) {
                    cycleBase = Number(settings.ciclo310FixedValue);
                } else if (settings.ciclo310Mode === 'PERCENT') {
                    cycleBase = baseAmount;
                }
                calculatedAmount = cycleBase * multiplier;
                console.log(`[RiskEngine] Ciclo Aplicado: Step ${step} | Multiplicador ${multiplier} | Base ${cycleBase.toFixed(2)} | Nova Stake: ${calculatedAmount.toFixed(2)}`);
                break;

            default:
                calculatedAmount = baseAmount;
        }

        console.log(`[RiskEngine] Stake Recalculada Final: ${calculatedAmount.toFixed(2)}`);

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
