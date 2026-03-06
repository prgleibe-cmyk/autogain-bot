
import React, { useEffect, useState } from 'react';
import { BotStatus } from '../types';
import { useBotContext } from '../context/BotContext';
import { Play, Square, LogIn, Power, RefreshCcw, Wifi, ShieldCheck, Briefcase, GraduationCap } from 'lucide-react';

const ControlPanel: React.FC = () => {
  const { 
    status, toggleBot, isBrokerConnected, 
    setIsConnectModalOpen, disconnectBroker, wallet, switchAccount,
    currentEntryAmount,
    wakeUpTime
  } = useBotContext();

  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!wakeUpTime || (status !== BotStatus.WAITING_OPPORTUNITY && status !== BotStatus.HIBERNATING && status !== BotStatus.STOPPED_LOSS)) {
      setTimeLeft("");
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = wakeUpTime - now;
      if (diff <= 0) {
        setTimeLeft("RETOMANDO...");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [wakeUpTime, status]);

  const isRunning = status === BotStatus.TRADING || status === BotStatus.ANALYZING || status === BotStatus.PAUSED_RISK;
  const isWaiting = status === BotStatus.WAITING_OPPORTUNITY || status === BotStatus.HIBERNATING || status === BotStatus.STOPPED_LOSS;

  return (
    <div className="space-y-4">
      
      {/* ACCOUNT CONTROL GRID */}
      {isBrokerConnected && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => wallet.accountType === 'DEMO' && switchAccount()}
            disabled={isRunning}
            className={`flex-1 h-12 rounded-xl transition-all flex flex-col items-center justify-center border font-black uppercase tracking-widest text-[8px] ${
              wallet.accountType === 'REAL' 
              ? 'bg-gold-500/10 border-gold-500/50 text-gold-500 shadow-lg shadow-gold-500/10' 
              : 'bg-slate-900 border-white/5 text-slate-600 hover:text-slate-400'
            }`}
          >
            Terminal Real
          </button>
          <button
            onClick={() => wallet.accountType === 'REAL' && switchAccount()}
            disabled={isRunning}
            className={`flex-1 h-12 rounded-xl transition-all flex flex-col items-center justify-center border font-black uppercase tracking-widest text-[8px] ${
              wallet.accountType === 'DEMO' 
              ? 'bg-amber-600/10 border-amber-600/50 text-amber-500 shadow-lg shadow-amber-600/10' 
              : 'bg-slate-900 border-white/5 text-slate-600 hover:text-slate-400'
            }`}
          >
            Simulação
          </button>
        </div>
      )}

      {/* NEXT POSITION CARD */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
        <div className="space-y-1">
          <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Próxima Entrada</span>
          <div className="text-xl font-mono font-black text-white">
            {wallet.currency} {currentEntryAmount.toFixed(2)}
          </div>
        </div>
        <div className="p-2 bg-gold-500/10 rounded-xl border border-gold-500/20 text-gold-500">
           <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* MASTER ACTION BUTTON */}
      <div className="space-y-3">
        <button
          onClick={() => {
            if (!isBrokerConnected) setIsConnectModalOpen(true);
            else if (!isWaiting) toggleBot();
          }}
          disabled={isWaiting}
          className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-3 group active:scale-[0.98] ${
            !isBrokerConnected 
            ? 'bg-gold-600 hover:bg-gold-500 text-slate-950'
            : isRunning 
            ? 'bg-rose-600 hover:bg-rose-700 text-white' 
            : isWaiting
            ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5'
            : 'bg-white hover:bg-slate-100 text-slate-950'
          }`}
        >
          {!isBrokerConnected ? (
             <> <LogIn className="w-4 h-4" /> Conectar Conta </>
          ) : isWaiting ? (
            <> <RefreshCcw className="w-4 h-4 animate-spin" /> {timeLeft} </>
          ) : isRunning ? (
            <> <Square className="w-4 h-4 fill-current" /> Encerrar Sessão </>
          ) : (
            <> <Play className="w-4 h-4 fill-current" /> Iniciar Algoritmo </>
          )}
        </button>

        {isBrokerConnected && (
          <button
            onClick={disconnectBroker}
            disabled={isRunning}
            className="w-full py-2 text-[8px] font-black uppercase tracking-[0.3em] text-slate-700 hover:text-rose-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <Power className="w-3 h-3" /> Encerrar Sessão Segura
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(ControlPanel);
