import React from 'react';
import { Trade, TradeResult } from '../../types';
import { TrendingUp, TrendingDown, Timer, Zap, Trophy, ThumbsDown, Activity } from 'lucide-react';

interface TradeDisplayProps {
  activeTrade: Trade;
  currentPrice: number;
}

const TradeDisplay: React.FC<TradeDisplayProps> = ({ activeTrade, currentPrice }) => {
  const isCall = activeTrade.direction === 'CALL';
  const isFinished = activeTrade.result === TradeResult.WIN || activeTrade.result === TradeResult.LOSS;
  
  const isWinning = isFinished 
    ? activeTrade.result === TradeResult.WIN 
    : (isCall ? currentPrice > activeTrade.entryPrice : currentPrice < activeTrade.entryPrice);
  
  const isDraw = !isFinished && currentPrice === activeTrade.entryPrice;

  const diff = Math.abs(currentPrice - activeTrade.entryPrice).toFixed(5);
  const projectedProfit = activeTrade.amount * (activeTrade.payout / 100);
  const displayProfit = isFinished ? activeTrade.profit : (isWinning ? projectedProfit : -activeTrade.amount);

  // Estilização Compacta
  const borderColor = isDraw ? 'border-slate-600' : isWinning ? 'border-emerald-500/50' : 'border-rose-500/50';
  const bgGradient = isFinished 
     ? (isWinning ? 'from-emerald-900/20 to-slate-900' : 'from-rose-900/20 to-slate-900')
     : (isWinning ? 'from-emerald-950/40 to-slate-900' : 'from-rose-950/40 to-slate-900');
  
  const statusTextColor = isDraw ? 'text-slate-400' : isWinning ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className={`w-full rounded-xl border ${borderColor} bg-gradient-to-br ${bgGradient} relative overflow-hidden shadow-lg shrink-0 transition-all duration-300`}>
       
       {/* Background Animation (Pulse se ativo) */}
       {!isFinished && (
           <div className={`absolute inset-0 opacity-10 animate-pulse ${isWinning ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
       )}

       {/* HEADER COMPACTO */}
       <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/20 relative z-10">
          <div className="flex items-center gap-2">
             <div className="p-1 rounded bg-slate-800 border border-white/10">
                <Activity className="w-3 h-3 text-cyan-400" />
             </div>
             <div>
                <div className="text-xs font-black text-white leading-none">{activeTrade.asset}</div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">{activeTrade.strategyName.split(' ')[0]}...</div>
             </div>
          </div>
          <div className="text-right">
             <div className={`text-sm font-bold font-mono ${statusTextColor}`}>
                {displayProfit >= 0 ? '+' : ''}{displayProfit.toFixed(2)}
             </div>
             <div className="text-[9px] text-slate-500 font-bold uppercase">{isFinished ? 'Resultado' : 'Retorno'}</div>
          </div>
       </div>

       {/* BODY COMPACTO */}
       <div className="p-3 relative z-10 space-y-3">
          
          <div className="flex items-center justify-between gap-2">
              {/* Lado Esquerdo: Entrada */}
              <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Entrada</span>
                  <div className={`flex items-center gap-1 font-mono text-xs font-bold ${isCall ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isCall ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {activeTrade.entryPrice.toFixed(5)}
                  </div>
              </div>

              {/* Centro: Status */}
              <div className="flex flex-col items-center justify-center">
                  {!isFinished ? (
                      <div className="flex flex-col items-center">
                         <span className="text-[9px] font-mono text-slate-400 mb-0.5">DIF: {diff}</span>
                         <div className={`h-1 w-12 rounded-full overflow-hidden bg-slate-800`}>
                            <div className={`h-full transition-all duration-300 ${isWinning ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: '100%' }}></div>
                         </div>
                      </div>
                  ) : (
                      <div className={`p-1.5 rounded-full border ${isWinning ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-rose-500/10 border-rose-500/50'}`}>
                          {isWinning ? <Trophy className="w-4 h-4 text-emerald-400" /> : <ThumbsDown className="w-4 h-4 text-rose-400" />}
                      </div>
                  )}
              </div>

              {/* Lado Direito: Atual */}
              <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Atual</span>
                  <div className={`font-mono text-xs font-bold ${!isFinished ? 'text-white' : (isWinning ? 'text-emerald-400' : 'text-rose-400')}`}>
                      {isFinished ? (isWinning ? 'WIN' : 'LOSS') : currentPrice.toFixed(5)}
                  </div>
              </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded border border-white/5">
                 <Zap className="w-3 h-3 text-amber-500" />
                 <span className="text-[10px] text-white font-bold">${activeTrade.amount.toFixed(2)}</span>
              </div>

              <div className={`flex items-center gap-1 text-[9px] uppercase font-bold ${isFinished ? 'text-slate-500' : 'text-cyan-400 animate-pulse'}`}>
                  <Timer className="w-3 h-3" />
                  {isFinished ? 'Finalizado' : 'Em andamento'}
              </div>
          </div>
       </div>
    </div>
  );
};

export default React.memo(TradeDisplay);