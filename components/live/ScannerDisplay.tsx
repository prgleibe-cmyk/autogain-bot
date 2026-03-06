
import React, { useEffect, useState } from 'react';
import { Activity, Crown, Zap, ShieldCheck, BrainCircuit } from 'lucide-react';
import { useBotContext } from '../../context/BotContext';
import { BotStatus } from '../../types';
import EliteLogo from '../EliteLogo';

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
  const assetDisplay = currentAsset && currentAsset !== '---' ? currentAsset : 'VARREDURA ATIVA';

  return (
    <div className="h-full w-full bg-slate-950 rounded-[2.5rem] border border-white/5 p-6 lg:p-10 relative flex flex-col items-center justify-start pt-20 overflow-y-auto custom-scrollbar">
      
      {/* Debug Marker */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-[10px] font-bold text-white rounded z-50">
        V2.5.2-DEBUG
      </div>

      {/* Badges */}
      <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-20 flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-black/80 border border-emerald-500/40 px-4 py-2 rounded-2xl shadow-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em]">Escudo Ativo</span>
          </div>
      </div>

      {/* Radar & Logo Area */}
      <div className="relative w-64 h-64 lg:w-96 lg:h-96 mb-10 shrink-0">
         {/* Radar Background */}
         <div className="absolute inset-0 rounded-full border border-white/20 bg-slate-900 shadow-2xl overflow-hidden">
            <div 
                className="absolute inset-0 bg-gradient-to-r from-gold-500/40 to-transparent origin-center"
                style={{ transform: `rotate(${radarRotation}deg)` }}
            ></div>
         </div>
         
         {/* Logo */}
         <div className="absolute inset-0 flex items-center justify-center z-10">
            <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-40 h-40 lg:w-64 lg:h-64 object-contain drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/2922/2922561.png';
                }}
            />
         </div>
      </div>

      {/* Text Info Area */}
      <div className="text-center space-y-8 w-full max-w-2xl z-10 pb-10">
         <div className="space-y-4">
            <h2 className="text-5xl lg:text-8xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl">
                {isHibernating ? 'META ATINGIDA' : assetDisplay}
            </h2>
            <div className="flex items-center justify-center gap-3">
                <div className="h-px w-12 bg-gold-500/50"></div>
                <span className="text-xs text-gold-500 font-black uppercase tracking-[0.5em]">Institutional Algo v2.5</span>
                <div className="h-px w-12 bg-gold-500/50"></div>
            </div>
         </div>

         <div className="bg-slate-900/80 border border-white/10 px-10 py-6 rounded-[2rem] shadow-2xl">
            <p className="text-slate-200 font-mono text-sm lg:text-lg font-bold mb-4">
                {isHibernating ? "Aguardando reinicialização automática amanhã" : (lastAnalysis || "Varredura em andamento...")}
            </p>
            
            {aiConfidence > 0 && (
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] text-gold-500 font-black tracking-widest uppercase">Confidência Neural</span>
                    <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400" style={{ width: `${aiConfidence}%` }}></div>
                    </div>
                    <span className="text-lg font-black text-white font-mono">{aiConfidence}%</span>
                </div>
            )}
         </div>

         {/* Logs */}
         <div className="bg-black/60 rounded-2xl border border-white/5 p-5 font-mono text-[11px] text-slate-400 text-left space-y-2 h-32 overflow-y-auto custom-scrollbar shadow-inner">
            {scanLog.map((log, i) => (
                <div key={i} className={`flex items-center gap-4 ${i === 0 ? 'text-gold-400' : 'opacity-50'}`}>
                    <span className="shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span>{log}</span>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default ScannerDisplay;
