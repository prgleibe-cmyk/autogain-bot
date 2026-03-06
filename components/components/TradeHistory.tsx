
import React, { useMemo } from 'react';
import { useBotContext } from '../context/BotContext';
import { TradeResult, OptionType } from '../types';
import { TrendingUp, TrendingDown, CheckCircle2, XCircle, Timer, Activity, Zap, Layers } from 'lucide-react';

const TradeHistory: React.FC = () => {
  const { trades, currentPrice } = useBotContext();
  
  const displayTrades = useMemo(() => {
    return trades
      .filter(t => t.result === TradeResult.WIN || t.result === TradeResult.LOSS || t.result === TradeResult.PENDING)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [trades]);

  return (
    <div className="flex flex-col h-full bg-slate-950 w-full lg:w-80 lg:border-l border-white/5 transition-all duration-300 overflow-hidden">
      
      {/* HEADER */}
      <div className="shrink-0 px-5 py-4 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl flex items-center justify-between">
          <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-500" /> 
            FLUXO EM TEMPO REAL
          </h3>
          <span className="text-[8px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-lg border border-white/5 font-mono font-black">
            {displayTrades.length} ITEMS
          </span>
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar pb-32 lg:pb-3">
        
        {displayTrades.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-3 opacity-30 py-20">
              <Layers className="w-10 h-10 stroke-[1px]" />
              <p className="text-[8px] font-black uppercase tracking-widest">FILA VAZIA</p>
           </div>
        )}

        {displayTrades.map((trade) => {
          const isPending = trade.result === TradeResult.PENDING;
          const isFinished = trade.result === TradeResult.WIN || trade.result === TradeResult.LOSS;
          const isWinning = trade.direction === 'CALL' ? currentPrice > trade.entryPrice : currentPrice < trade.entryPrice;
          const winStatus = isFinished ? (trade.result === TradeResult.WIN) : isWinning;

          return (
            <div 
              key={trade.id}
              className={`relative overflow-hidden rounded-xl border p-3 transition-all duration-300 group ${
                isPending 
                  ? (winStatus ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-rose-500/5 border-rose-500/30') 
                  : 'bg-slate-900/40 border-white/5'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1.5 flex-1">
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white tracking-tight">{trade.asset}</span>
                   </div>
                   
                   <div className="flex items-center gap-1.5">
                       <span className={`text-[7px] px-1 py-0.2 rounded font-black uppercase border ${
                          trade.optionType === OptionType.DIGITAL 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                       }`}>
                          {trade.optionType === OptionType.DIGITAL ? 'DIG' : 'BIN'}
                       </span>
                       <span className="text-[8px] text-slate-600 font-mono flex items-center gap-1">
                          {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                       </span>
                   </div>
                </div>

                <div className="flex flex-col items-end text-right space-y-1">
                   <div className={`flex items-center gap-1 font-black text-[8px] uppercase tracking-widest ${trade.direction === 'CALL' ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {trade.direction === 'CALL' ? 'COMPRA' : 'VENDA'}
                   </div>

                   <div className={`text-sm font-mono font-black ${isFinished ? (trade.result === TradeResult.WIN ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`}>
                      {isPending ? (
                          <span className="text-[8px] animate-pulse">LIVE...</span>
                      ) : (
                          `${trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}`
                      )}
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(TradeHistory);
