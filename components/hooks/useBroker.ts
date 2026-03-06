
import { useState, useEffect, useRef, useCallback } from 'react';
import { Broker, Wallet, BotStatus } from '../types';
import { bridgeApi } from '../services/bridgeApi';

interface UseBrokerProps {
  setStatus: (s: BotStatus) => void;
  setLastAnalysis: (s: string) => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, message: string, amount?: string) => void;
}

export const useBroker = ({ setStatus, setLastAnalysis, addToast }: UseBrokerProps) => {
  const [broker, setBroker] = useState<Broker>(Broker.IQ_OPTION);
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  
  const [realBalance, setRealBalance] = useState(0);
  const [demoBalance, setDemoBalance] = useState(0);

  const [wallet, setWallet] = useState<Wallet>({
    balance: 0.00,
    initialBalance: 0.00,
    currency: 'USD',
    accountType: 'REAL'
  });

  const balanceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failCountRef = useRef(0);

  const disconnectBroker = useCallback(() => {
    console.log("[Broker] Desconectando...");
    setIsBrokerConnected(false);
    setStatus(BotStatus.IDLE);
    setWallet({
      balance: 0,
      initialBalance: 0,
      currency: 'USD',
      accountType: 'REAL'
    });
    setLastAnalysis("Desconectado da corretora");
    if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current);
  }, [setStatus, setLastAnalysis]);

  const connectBroker = useCallback((initialBalance: number, accountType: 'REAL' | 'DEMO') => {
    console.log(`[Broker] Conectado. Saldo: ${initialBalance}`);
    
    if (accountType === 'REAL') setRealBalance(initialBalance);
    else setDemoBalance(initialBalance);

    setWallet({
      balance: initialBalance,
      initialBalance: initialBalance,
      currency: 'USD',
      accountType: accountType
    });
    
    setIsBrokerConnected(true);
    failCountRef.current = 0; // Reset fails on new connect
    setLastAnalysis(`Conectado na Conta ${accountType}`);
  }, []);

  useEffect(() => {
    if (isBrokerConnected) {
       const syncBalance = async () => {
          try {
             const balResult = await bridgeApi.getBalance();

             if (balResult === null) {
                 failCountRef.current++;
                 // Tolera até 10 falhas seguidas antes de desconectar (Watchdog suave)
                 // Isso dá tempo para o Python reconectar (cerca de 50 segundos)
                 if (failCountRef.current > 10) {
                     console.error("[Broker] WATCHDOG: Sessão perdida.");
                     disconnectBroker();
                     addToast('error', 'SESSÃO EXPIRADA', 'A conexão com a corretora caiu após várias tentativas.');
                 }
                 return;
             }

             failCountRef.current = 0;
             const numericBalance = typeof balResult === 'string' ? parseFloat(balResult) : balResult;

             if (numericBalance !== null && !isNaN(numericBalance)) {
                setWallet(prev => {
                   if (prev.balance !== numericBalance) {
                      return { ...prev, balance: numericBalance };
                   }
                   return prev;
                });
             }
          } catch (e) {
             console.error("[Broker] Erro sinc saldo:", e);
          }
       };

       syncBalance();
       balanceIntervalRef.current = setInterval(syncBalance, 5000);
    }

    return () => {
       if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current);
    };
  }, [isBrokerConnected, disconnectBroker, addToast]);

  const switchAccount = useCallback(async () => {
      if (!isBrokerConnected) return;

      const newType = wallet.accountType === 'REAL' ? 'DEMO' : 'REAL';
      const apiType = newType === 'DEMO' ? 'PRACTICE' : 'REAL';

      try {
          const response = await fetch('/switch_account', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ type: apiType })
          });

          if (!response.ok) throw new Error("Erro na troca de conta.");

          setWallet(prev => ({
              ...prev,
              accountType: newType
          }));

          addToast('info', 'CONTA ALTERADA', `Alternado para conta ${newType}`);

      } catch (e) {
          addToast('error', 'ERRO DE TROCA', 'Falha na comunicação com a corretora.');
      }
  }, [isBrokerConnected, wallet.accountType, addToast]);

  return {
    broker,
    setBroker,
    isBrokerConnected,
    wallet,
    setWallet,
    realBalance,
    setRealBalance,
    demoBalance,
    setDemoBalance,
    connectBroker,
    disconnectBroker,
    switchAccount
  };
};
