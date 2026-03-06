
import { useMemo } from 'react';
import { SystemSettings, Wallet, Broker } from '../types';
import { RiskEngine } from '../services/risk/RiskEngine';

interface RiskManagerProps {
  wallet: Wallet;
  systemSettings: SystemSettings;
  consecutiveLosses: number;
  consecutiveWins: number;
  cycleProfitPile: number;
  currentCycleStep: number;
  broker: Broker;
}

/**
 * HOOK BRIDGE: useRiskManager
 * Apenas mantém a compatibilidade da UI com o RiskEngine puro.
 */
export const useRiskManager = ({
  wallet,
  systemSettings,
  consecutiveLosses,
  consecutiveWins,
  cycleProfitPile,
  currentCycleStep,
  broker
}: RiskManagerProps) => {

  const currentEntryAmount = useMemo(() => {
     return RiskEngine.calculateEntry(
         wallet.balance,
         wallet.initialBalance,
         systemSettings,
         {
             consecutiveLosses,
             consecutiveWins,
             cycleProfitPile,
             currentCycleStep
         }
     );
  }, [wallet.balance, wallet.initialBalance, currentCycleStep, consecutiveLosses, consecutiveWins, cycleProfitPile, systemSettings]);

  return { currentEntryAmount };
};
