
import React, { useState, useEffect } from 'react';
import { Invoice, SubscriptionStatus, SystemSettings } from '../types';
import { Copy, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Smartphone, Banknote, GraduationCap, Zap } from 'lucide-react';
import { financeManager } from '../services/financeManager';

interface PaymentModalProps {
  status: SubscriptionStatus;
  invoice: Invoice | undefined;
  userEmail: string;
  systemSettings: SystemSettings;
  onPaymentConfirmed: () => void;
  isDemo: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ status, invoice, userEmail, systemSettings, onPaymentConfirmed, isDemo }) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const isBlocked = status === 'BLOCKED';
  const isFree = (invoice?.amount || 0) <= 0 || isDemo;

  useEffect(() => {
    if (!invoice) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const deadline = invoice.createdAt + (12 * 60 * 60 * 1000);
      const diff = deadline - now;
      if (diff <= 0) {
         setTimeLeft("BLOQUEADO");
      } else {
         const hours = Math.floor(diff / (1000 * 60 * 60));
         const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
         setTimeLeft(`${hours}h ${minutes}m restantes`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [invoice]);

  const handleCopy = () => {
    if (invoice?.pixCode) {
      navigator.clipboard.writeText(invoice.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmManual = async () => {
    if (!invoice) return;
    setChecking(true);
    
    if (isFree) {
        financeManager.confirmPayment(invoice.id);
        setTimeout(() => {
            setChecking(false);
            onPaymentConfirmed();
        }, 800);
    } else {
        // Na Real, forçamos a checagem real
        await financeManager.checkCycle(userEmail, { balance: invoice.growthReference, accountType: 'REAL' } as any, systemSettings);
        setTimeout(() => {
            setChecking(false);
            onPaymentConfirmed();
        }, 1500);
    }
  };

  if (!invoice) return null;

  // Cálculo do crescimento que gerou esta fatura
  const hwmAtCreation = invoice.growthReference / (1 + (systemSettings.growthThresholdPercent / 100));
  const growthDisplayed = hwmAtCreation > 0 ? ((invoice.growthReference - hwmAtCreation) / hwmAtCreation * 100) : systemSettings.growthThresholdPercent;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md transition-all duration-500`}>
       <div className={`w-full max-w-md bg-slate-900 border ${isFree ? 'border-amber-500/30' : 'border-white/10'} rounded-3xl overflow-hidden relative shadow-2xl animate-in zoom-in-95`}>
          
          <div className="bg-slate-950 p-6 text-center border-b border-white/5">
             <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${isFree ? 'bg-amber-500/10 text-amber-500' : 'bg-gold-500/10 text-gold-500'}`}>
                {isFree ? <GraduationCap className="w-8 h-8" /> : <Banknote className="w-8 h-8" />}
             </div>
             
             <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {isFree ? 'Ciclo Demo Concluído' : 'Fatura de Performance'}
             </h2>
             <p className="text-xs text-slate-500 mt-2">
                {isFree ? 'Banca de simulação resetada com sucesso!' : 'Seu lucro em conta real atingiu o gatilho.'}
             </p>
          </div>

          <div className="p-6 space-y-6">
             <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 flex justify-between items-center">
                <div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Crescimento</p>
                   <p className="text-emerald-400 font-mono font-bold">+{growthDisplayed.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Comissão</p>
                   <p className="text-xl text-white font-mono font-bold">
                     {isFree ? '$ 0.00' : `$ ${invoice.amount.toFixed(2)}`}
                   </p>
                </div>
             </div>

             {!isFree && (
                 <div className="flex flex-col items-center gap-4">
                    <div className="p-2 bg-white rounded-xl">
                        <img src={invoice.pixQrImage} alt="QR" className="w-32 h-32" />
                    </div>
                    <div className="w-full space-y-2">
                        <div className="flex gap-2">
                            <div className="flex-1 bg-black/40 border border-slate-700 rounded-xl px-4 py-2 text-[10px] text-slate-400 font-mono truncate">
                                {invoice.pixCode}
                            </div>
                            <button onClick={handleCopy} className="p-2 bg-slate-800 rounded-xl text-white">
                                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                 </div>
             )}

             {isFree && (
                 <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                    <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Modo Simulação</p>
                    <p className="text-xs text-slate-500 mt-1">Nenhum pagamento real é necessário. Clique abaixo para confirmar.</p>
                 </div>
             )}

             <button 
                onClick={handleConfirmManual}
                disabled={checking}
                className={`w-full py-4 ${isFree ? 'bg-amber-600' : 'bg-emerald-600'} text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2`}
             >
                {checking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isFree ? 'CONFIRMAR E RECOMEÇAR' : 'VERIFICAR PAGAMENTO'}
             </button>
          </div>
       </div>
    </div>
  );
};

export default PaymentModal;
