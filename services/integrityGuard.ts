
import { SystemSettings, Wallet, BotStatus, RiskMode, SubscriptionStatus } from '../types';
import { dailyGoalGuard } from './dailyGoalGuard';

/**
 * INTEGRITY GUARD (BLINDAGEM)
 */
export class IntegrityGuard {
    static validateState(
        targetStatus: BotStatus, 
        settings: SystemSettings, 
        wallet: Wallet,
        subscriptionStatus?: SubscriptionStatus,
        currentProfit: number = 0,
        initialBalance: number = 0
    ): { valid: boolean; reason?: string; isFinancial?: boolean } {
        
        // Se o objetivo é parar o bot (IDLE), sempre permitir
        if (targetStatus === BotStatus.IDLE) {
            return { valid: true };
        }

        // 1. BLOQUEIO FINANCEIRO (PENDÊNCIA DE COMISSÃO)
        if (subscriptionStatus === 'BLOCKED') {
            return { valid: false, reason: "Acesso bloqueado: Pendência financeira identificada.", isFinancial: true };
        }

        // 2. META DIÁRIA (Verificação ao iniciar)
        if (settings.dailyGoalConfig?.enabled) {
            const goalCheck = dailyGoalGuard.check(
                currentProfit,
                initialBalance,
                settings.dailyGoalConfig,
                () => {} // No-op callback for validation only
            );
            if (!goalCheck.allowed) {
                return { valid: false, reason: goalCheck.reason || "Meta diária atingida ou aguardando horário." };
            }
        }

        // 3. Validação de Saldo (Permitir se for maior que zero ou se for conta demonstração)
        if (wallet.balance <= 0 && wallet.accountType === 'REAL') {
            return { valid: false, reason: "Saldo insuficiente na conta REAL." };
        }

        // 3. Validação de Risco (Sanity Check)
        if (settings.riskMode === RiskMode.FIXED && settings.entryFixedValue <= 0) {
            return { valid: false, reason: "Configuração de valor fixo inválida." };
        }

        return { valid: true };
    }

    static isDataFresh(lastTimestamp: number): boolean {
        const MAX_STALENESS = 15000;
        return (Date.now() - lastTimestamp) < MAX_STALENESS;
    }
}
