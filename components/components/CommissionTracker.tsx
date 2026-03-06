
import React, { useMemo } from 'react';
import { useBotContext } from '../context/BotContext';
import { PieChart, TrendingUp, DollarSign, Target, ArrowUpCircle } from 'lucide-react';

const CommissionTracker: React.FC = () => {
  const { 
    currentProfitCycle, 
    accumulatedCommission, 
    wallet,
    systemSettings,
    setShowPaymentModal,
    subscriptionStatus
  } = useBotContext();

  // Se a cobrança estiver desativada, não renderiza
  if (!systemSettings.commissionEnabled) return null;

  const financialState = (useBotContext() as any).financialState; // Acessando via contexto estendido ou hook interno se disponível
  // Como o hook central ainda não expõe o internalState, vamos recalcular visualmente aqui
  const highWaterMark = (wallet as any).highWaterMark || wallet.initialBalance;
  
  const growthValue = wallet.balance - highWaterMark;
  const growthPercent = highWaterMark > 0 ? (growthValue / highWaterMark) * 100 : 0;
  const threshold = systemSettings.growthThresholdPercent || 10;
  
  // Progresso do Gatilho
  const progressPercent = Math.min(100, Math.max(0, (growthPercent / threshold) * 100));
  const isProfit = growthValue > 0;
  
  const statusColor = progressPercent >= 90 ? 'text-rose-400' : progressPercent >= 70 ? 'text-amber-400' : 'text-slate-400';
  const progressColor = progressPercent >= 90 ? 'bg-rose-500' : progressPercent >= 70 ? 'bg-amber-500' : 'bg-gold-500';

  return (
    <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-white/5 relative overflow-hidden group">
        {isProfit && <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>}
        
        <div className="flex justify-between items-start mb-3 relative z-10">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-gold-500" /> Gatilho de Cobrança
                </span>
                <span className="text-[10px] text-slate-600 font-mono mt-0.5">Alvo: {threshold.toFixed(1)}% de Crescimento</span>
            </div>
            
            <div className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 bg-gold-500/10 border-gold-500/30 text-gold-400`}>
                <DollarSign className="w-3 h-3" />
                <span className="text-xs font-bold font-mono">{accumulatedCommission.toFixed(2)}</span>
            </div>
        </div>

        <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className={`p-2 rounded-full ${isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
                <div className={`text-2xl font-mono font-bold leading-none ${isProfit ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {growthPercent.toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">Crescimento Atual da Banca</div>
            </div>
        </div>

        <div className="space-y-2 relative z-10">
            <div className="flex justify-between items-end text-xs">
                <span className={`font-bold flex items-center gap-1.5 ${statusColor}`}>
                    {progressPercent.toFixed(0)}% do Objetivo
                </span>
                <span className="text-[9px] text-slate-600 font-mono">
                    HWM: ${highWaterMark.toFixed(2)}
                </span>
            </div>
            
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${progressColor} ${progressPercent > 90 ? 'animate-pulse' : ''}`} 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
        </div>

        {subscriptionStatus !== 'ACTIVE' && (
            <button 
                onClick={() => setShowPaymentModal(true)}
                className="mt-4 w-full py-2 bg-gold-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-gold-500 flex items-center justify-center gap-2"
            >
                Liberar Acesso
            </button>
        )}
    </div>
  );
};

export default CommissionTracker;
