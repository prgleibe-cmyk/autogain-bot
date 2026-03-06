
import { FinanceState, Invoice, SubscriptionStatus, SystemSettings, Wallet } from '../types';
import { asaasService } from './asaasService';

const STORAGE_KEY = 'autogain_financial_state_v5';
let internalState: FinanceState | null = null; 

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; 

const getInitialState = (initialBalance: number = 0): FinanceState => {
  if (internalState) return internalState;
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      internalState = JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao ler FinanceState", e);
    }
  }
  
  if (!internalState) {
    internalState = {
      netProfit: 0,
      commissionDue: 0,
      highWaterMark: initialBalance || 0,
      lastSettlementDate: Date.now(),
      invoices: [],
      status: 'ACTIVE'
    };
  }
  return internalState!;
};

const ADMIN_EMAILS = ['gleibeswk@gmail.com'];

export const financeManager = {
  getState: (currentBalance: number): FinanceState => getInitialState(currentBalance),
  
  saveState: (state: FinanceState) => {
    internalState = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  registerTradeProfit: (profit: number, settings: SystemSettings, isExempt: boolean = false, userEmail?: string) => {
    const state = getInitialState();
    const isMaster = userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase());

    if (!settings.commissionEnabled || isExempt || isMaster) {
        state.netProfit += profit;
        state.commissionDue = 0;
        state.status = 'ACTIVE';
        financeManager.saveState(state);
        return state;
    }

    state.netProfit += profit;
    state.commissionDue = Math.max(0, state.netProfit * (settings.commissionRate / 100));
    financeManager.saveState(state);
    return state;
  },

  checkCycle: async (userEmail: string, wallet: Wallet, settings: SystemSettings): Promise<FinanceState> => {
    const safeBalance = wallet?.balance || 0;
    let state = getInitialState(safeBalance);
    const now = Date.now();
    const isMaster = userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase());
    const isDemo = wallet?.accountType === 'DEMO';

    if (isMaster || !settings.commissionEnabled) {
        state.status = 'ACTIVE';
        financeManager.saveState(state);
        return state;
    }

    const pendingInvoice = state.invoices.find(i => i.status === 'PENDING');
    if (pendingInvoice) {
       if (pendingInvoice.amount > 0 && !isDemo) {
           const status = await asaasService.checkPaymentStatus(pendingInvoice.id);
           if (status === 'PAID') {
              return financeManager.confirmPayment(pendingInvoice.id);
           }
       }

       const timeOverdue = now - (pendingInvoice.createdAt || now);
       state.status = timeOverdue > GRACE_PERIOD_MS ? 'BLOCKED' : 'WARNING';
       financeManager.saveState(state);
       return state;
    }

    if (safeBalance > 0 && state.highWaterMark > 0) {
        const growthValue = safeBalance - state.highWaterMark;
        const growthPercent = (growthValue / state.highWaterMark) * 100;
        const threshold = settings.growthThresholdPercent || 10;

        if (growthPercent >= threshold && state.commissionDue > 0) {
            try {
                const chargeAmount = isDemo ? 0 : state.commissionDue;
                const newInvoice = await asaasService.createPixCharge(chargeAmount, userEmail);
                
                newInvoice.profitReference = state.netProfit;
                newInvoice.growthReference = safeBalance;
                
                state.invoices.push(newInvoice);
                state.status = 'WARNING';
                financeManager.saveState(state);
            } catch (e) {
                console.error("[Finance] Erro fatura:", e);
            }
        }
    } else if ((state.highWaterMark === 0 || !state.highWaterMark) && safeBalance > 0) {
        state.highWaterMark = safeBalance;
        financeManager.saveState(state);
    }

    return state;
  },

  confirmPayment: (invoiceId: string): FinanceState => {
      const state = getInitialState();
      const invoice = state.invoices.find(i => i.id === invoiceId);
      if (invoice) {
          invoice.status = 'PAID';
          state.status = 'ACTIVE';
          state.highWaterMark = invoice.growthReference || state.highWaterMark;
          state.netProfit = 0;
          state.commissionDue = 0;
          financeManager.saveState(state);
      }
      return state;
  },

  simulatePayment: (invoiceId: string) => {
     localStorage.setItem(`debug_pay_${invoiceId}`, 'true');
  }
};
