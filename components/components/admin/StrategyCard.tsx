import React from 'react';
import { StrategyDefinition, SystemSettings } from '../../types';
import { Trophy, RotateCcw } from 'lucide-react';

interface StrategyCardProps {
  strat: StrategyDefinition;
  settings: SystemSettings;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ strat, settings, onToggle, onReset }) => {
  const stats = settings.strategyStats?.[strat.id] || { wins: 0, losses: 0, profit: 0 };
  const total = stats.wins + stats.losses;
  const winRate = total > 0 ? (stats.wins / total) * 100 : 0;
  const isProfit = stats.profit >= 0;
  const isEnabled = settings.enabledStrategies[strat.id];

  return (
      <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${isEnabled ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10' : 'bg-slate-900 border-white/5 opacity-75'}`}>
          <div>
              <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-white text-lg leading-tight flex-1 mr-2">{strat.name}</h3>
                  <button 
                    onClick={() => onToggle(strat.id)}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${isEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isEnabled ? 'left-7' : 'left-1'}`}></div>
                  </button>
              </div>
              <p className="text-sm text-slate-400 mb-4 min-h-[40px] line-clamp-2">{strat.description}</p>
              <div className="flex gap-2 mb-6">
                  <span className="px-2 py-1 rounded bg-black/30 text-xs font-mono text-slate-400 border border-white/5">{strat.marketType}</span>
                  <span className={`px-2 py-1 rounded text-xs font-mono font-bold border ${strat.timeframe === 'M1' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'}`}>
                    {strat.timeframe}
                  </span>
              </div>
          </div>
          
          <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                      <span className="text-xs font-bold text-slate-300 uppercase">Performance</span>
                  </div>
                  <button 
                    onClick={() => onReset(strat.id)}
                    title="Zerar placar desta estratégia"
                    className="p-1.5 hover:bg-rose-500/20 rounded-md text-slate-500 hover:text-rose-400 transition-colors"
                  >
                      <RotateCcw className="w-3.5 h-3.5" />
                  </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase">Assertividade</span>
                    <span className={`font-mono font-bold text-sm ${winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase">Lucro Total</span>
                    <span className={`font-mono font-bold text-sm ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{stats.profit.toFixed(2)}
                    </span>
                  </div>
              </div>

              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${winRate}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5">
                  <span className="text-emerald-400">{stats.wins} Vitórias</span>
                  <span className="text-rose-400">{stats.losses} Derrotas</span>
              </div>
          </div>
      </div>
  );
};

export default StrategyCard;