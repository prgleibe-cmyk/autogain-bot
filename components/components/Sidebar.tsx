
import React, { useState, useEffect } from 'react';
import { useBotContext } from '../context/BotContext';
import { BotStatus } from '../types';
import ControlPanel from './ControlPanel';
import CommissionTracker from './CommissionTracker';
import { Crown, Activity, Wifi, WifiOff, Database, BarChart3, Globe, ShieldCheck } from 'lucide-react';

const Sidebar: React.FC<{ isTrialMode: boolean }> = ({ isTrialMode }) => {
  const { 
    status, aiConfidence, isBrokerConnected, broker, availableAssets
  } = useBotContext();

  const [networkInfo, setNetworkInfo] = useState({ ip: '...', proxy: false });

  useEffect(() => {
    if (isBrokerConnected) {
      const fetchNet = async () => {
        try {
          const res = await fetch('/balance');
          const data = await res.json();
          setNetworkInfo({ ip: data.ip, proxy: data.proxyActive });
        } catch (e) {}
      };
      fetchNet();
      const it = setInterval(fetchNet, 15000);
      return () => clearInterval(it);
    }
  }, [isBrokerConnected]);

  const isRunning = status === BotStatus.TRADING || status === BotStatus.ANALYZING || status === BotStatus.PAUSED_RISK;

  return (
    <div className="w-[380px] flex-shrink-0 bg-slate-950/40 backdrop-blur-2xl border-r border-white/5 flex flex-col z-30 h-full overflow-hidden">
      
      {/* CONNECTION STATUS HEADER */}
      <div className={`px-6 py-4 text-[9px] font-black flex flex-col gap-2 border-b border-white/5 ${isBrokerConnected ? 'bg-gold-500/5 text-gold-500' : 'bg-rose-500/5 text-rose-500'}`}>
         <div className="flex items-center justify-between uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
                {isBrokerConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {broker}: {isBrokerConnected ? 'CONEXÃO SEGURA' : 'OFFLINE'}
            </div>
            {isBrokerConnected && <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse"></div>}
         </div>
      </div>

      {/* NETWORK DIAGNOSTIC WIDGET */}
      {isBrokerConnected && (
        <div className="mx-6 mt-4 p-4 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-between shadow-inner">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${networkInfo.proxy ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                 {networkInfo.proxy ? <ShieldCheck className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Endereço de Saída</span>
                <span className="text-[10px] text-white font-mono font-bold">{networkInfo.ip}</span>
              </div>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Rota</span>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${networkInfo.proxy ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                 {networkInfo.proxy ? 'MASCARADA' : 'DIRETA'}
              </span>
           </div>
        </div>
      )}

      {/* CORE ENGINE STATUS */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className={`p-6 rounded-[2rem] border transition-all duration-700 relative overflow-hidden ${
          status === BotStatus.TRADING ? 'bg-gold-500/5 border-gold-500/30' :
          status === BotStatus.ANALYZING ? 'bg-amber-500/5 border-amber-500/20' :
          'bg-slate-900/40 border-white/5'
        }`}>
          {isRunning && <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="scan-line-gold"></div></div>}

          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-gold-500" /> Status Neural
               </span>
               <div className="text-2xl font-black tracking-tighter uppercase italic text-white">
                  {status === BotStatus.IDLE && "AGUARDANDO"}
                  {status === BotStatus.TRADING && "EXECUTANDO"}
                  {status === BotStatus.ANALYZING && "ESCANEANDO"}
                  {status === BotStatus.STOPPED_LOSS && "RESFRIAMENTO"}
               </div>
            </div>
            <div className="p-3 rounded-2xl border bg-slate-800/50 border-white/10 text-slate-600">
                <Activity className={`w-6 h-6 ${isRunning ? 'animate-pulse' : ''}`} />
            </div>
          </div>

          {isRunning && (
            <div className="space-y-4">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
                    <span>Confiança Média do Mercado</span>
                    <span className="text-gold-400">{aiConfidence}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-[1px]">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-amber-400" style={{ width: `${aiConfidence}%` }}></div>
                </div>
            </div>
          )}
        </div>

        <CommissionTracker />
        <ControlPanel />
      </div>
    </div>
  );
};

export default React.memo(Sidebar);
