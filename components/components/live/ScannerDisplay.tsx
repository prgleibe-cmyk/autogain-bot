
import React, { useEffect, useState } from 'react';
import { Activity, Crown, Zap, ShieldCheck, BrainCircuit } from 'lucide-react';
import { useBotContext } from '../../context/BotContext';
import { BotStatus } from '../../types';

interface ScannerDisplayProps {
  lastAnalysis: string;
  currentAsset: string;
}

const ScannerDisplay: React.FC<ScannerDisplayProps> = ({ lastAnalysis, currentAsset }) => {
  const { status, aiConfidence } = useBotContext();
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [radarRotation, setRadarRotation] = useState(0);

  useEffect(() => {
    const logs = [
      "Processando padrões harmônicos...",
      "Filtro de volatilidade: OK",
      "Sincronizando com Bridge HFT...",
      "Análise neural concluída em 14ms",
      "Liquidez institucional detectada"
    ];
    
    const interval = setInterval(() => {
       setRadarRotation(prev => (prev + 2) % 360);
       if (status === BotStatus.ANALYZING && Math.random() > 0.9) {
           const randomLog = logs[Math.floor(Math.random() * logs.length)];
           setScanLog(prev => [randomLog, ...prev].slice(0, 5));
       }
    }, 100);
    return () => clearInterval(interval);
  }, [status]);

  const isAnalyzing = status === BotStatus.ANALYZING;
  const isHibernating = status === BotStatus.HIBERNATING;

  return (
    <div className="h-full w-full bg-slate-950 rounded-[2.5rem] border border-white/5 p-6 lg:p-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01),transparent_70%)]"></div>
      
      <div className="absolute top-10 left-10 z-20 hidden lg:flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-emerald-500/20 px-4 py-2 rounded-2xl shadow-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Escudo Ativo</span>
          </div>
          {isAnalyzing && (
            <div className="flex items-center gap-3 bg-gold-500/10 backdrop-blur-xl border border-gold-500/40 px-4 py-2 rounded-2xl shadow-lg animate-pulse">
                <BrainCircuit className="w-4 h-4 text-gold-500" />
                <span className="text-[9px] font-black text-gold-500 uppercase tracking-[0.2em]">IA ANALISANDO MOMENTUM</span>
            </div>
          )}
          {isHibernating && (
            <div className="flex items-center gap-3 bg-blue-500/10 backdrop-blur-xl border border-blue-500/40 px-4 py-2 rounded-2xl shadow-lg">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">SISTEMA EM HIBERNAÇÃO</span>
            </div>
          )}
      </div>

      <div className="relative mb-12">
         <div className="relative w-72 h-72 lg:w-[28rem] lg:h-[28rem] rounded-full border border-white/10 flex items-center justify-center bg-slate-900/5 backdrop-blur-3xl shadow-2xl overflow-hidden">
            <div 
                className={`absolute inset-0 bg-gradient-to-r ${isAnalyzing ? 'from-gold-500/20' : isHibernating ? 'from-blue-500/10' : 'from-slate-500/5'} to-transparent origin-center`}
                style={{ transform: `rotate(${radarRotation}deg)` }}
            ></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <div className={`w-56 h-56 lg:w-80 lg:h-80 relative group transition-all duration-1000 ${isAnalyzing ? 'scale-110 brightness-125' : isHibernating ? 'scale-95 grayscale opacity-50' : 'scale-100 brightness-100'}`}>
                    <img 
                        src="/logo.png" 
                        alt="Logo" 
                        className="w-full h-full object-contain relative z-20 drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
                    />
                </div>
            </div>
         </div>
      </div>

      <div className="relative z-10 text-center space-y-6 w-full max-w-xl">
         <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
                <span className="h-1 w-8 bg-gold-500/30 rounded-full"></span>
                <span className="text-[10px] text-gold-500 font-black uppercase tracking-[0.4em]">Algorithmic Execution v2.5</span>
                <span className="h-1 w-8 bg-gold-500/30 rounded-full"></span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                {isHibernating ? 'META ATINGIDA' : (currentAsset !== '---' ? currentAsset : 'VARREDURA ATIVA')}
            </h2>
         </div>

         <div className="bg-white/5 backdrop-blur-xl border border-white/5 px-8 py-4 rounded-3xl flex flex-col items-center justify-center gap-2">
            <p className="text-slate-300 font-mono text-sm lg:text-base font-medium">
                {isHibernating ? "Aguardando reinicialização automática amanhã" : (lastAnalysis || "Inicie o algoritmo para varredura completa")}
            </p>
            {aiConfidence > 0 && (
                <div className="flex items-center gap-2">
                    <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gold-500" style={{ width: `${aiConfidence}%` }}></div>
                    </div>
                    <span className="text-[10px] text-gold-500 font-black">{aiConfidence}% CONFIDÊNCIA IA</span>
                </div>
            )}
         </div>

         <div className="bg-black/40 rounded-2xl border border-white/5 p-4 font-mono text-[10px] text-slate-500 text-left space-y-1 h-24 overflow-hidden">
            {scanLog.map((log, i) => (
                <div key={i} className={`flex items-center gap-3 ${i === 0 ? 'text-gold-500/80' : 'opacity-40'}`}>
                    <span>[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span>{log}</span>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default React.memo(ScannerDisplay);
