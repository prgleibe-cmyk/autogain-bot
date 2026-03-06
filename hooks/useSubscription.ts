
import { useState, useEffect, useCallback } from 'react';
import { SubscriptionStatus, Invoice, SystemSettings, Wallet } from '../types';
import { financeManager } from '../services/financeManager';

export const useSubscription = (
    isAuthenticated: boolean, 
    userEmail: string, 
    disconnectBroker: () => void,
    systemSettings: SystemSettings,
    wallet: Wallet
) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [pendingInvoice, setPendingInvoice] = useState<Invoice | undefined>(undefined);
  const [currentProfitCycle, setCurrentProfitCycle] = useState(0); 
  const [accumulatedCommission, setAccumulatedCommission] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const refreshFinancialState = useCallback(async (isActivationAttempt: boolean = false) => {
      if (!isAuthenticated || !userEmail) return;

      const state = await financeManager.checkCycle(userEmail, wallet, systemSettings);
      
      setSubscriptionStatus(state.status);
      
      const pending = state.invoices.find(i => i.status === 'PENDING');
      setPendingInvoice(pending);

      if (pending) {
          setCurrentProfitCycle(pending.profitReference);
          setAccumulatedCommission(pending.amount);
      } else {
          setCurrentProfitCycle(state.netProfit); 
          setAccumulatedCommission(state.commissionDue);
      }

      if (state.status === 'BLOCKED') {
         if (isActivationAttempt) setShowPaymentModal(true);
         disconnectBroker();
      }
  }, [isAuthenticated, userEmail, systemSettings, disconnectBroker, wallet]);

  useEffect(() => {
    if (isAuthenticated && userEmail && wallet.balance > 0) {
       refreshFinancialState(false);
    }
  }, [isAuthenticated, userEmail, wallet.balance, refreshFinancialState]);

  const handlePaymentConfirmed = async () => {
    const state = await financeManager.checkCycle(userEmail, wallet, systemSettings);
    
    setSubscriptionStatus(state.status);
    setCurrentProfitCycle(state.netProfit);
    setAccumulatedCommission(state.commissionDue);

    if (state.status === 'ACTIVE') {
        setShowPaymentModal(false);
        setPendingInvoice(undefined);
        return true;
    }
    return false;
  };

  return {
    subscriptionStatus,
    pendingInvoice,
    currentProfitCycle,
    accumulatedCommission,
    showPaymentModal,
    setShowPaymentModal,
    handlePaymentConfirmed,
    refreshFinancialState
  };
};
