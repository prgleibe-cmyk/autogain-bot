import React from 'react';
import { useBotContext } from '../context/BotContext';
import ScannerDisplay from './live/ScannerDisplay';
import TradeDisplay from './live/TradeDisplay';
import { Layers } from 'lucide-react';

const LiveExecution: React.FC = () => {
  const { activeTrades, currentPrice, lastAnalysis, currentAsset } = useBotContext();

  return (
    <div className="w-full h-full flex overflow-hidden relative bg-slate-950">
       
       {/* ÁREA PRINCIPAL: SCANNER (Sempre visível ou ocupando o espaço restante) */}
       <div className="flex-1 h-full relative z-0 transition-all duration-500">
          <ScannerDisplay 
             lastAnalysis={lastAnalysis} 
             currentAsset={currentAsset} 
          />
       </div>

       {/* COLUNA LATERAL DIREITA: LISTA DE TRADES */}
       {activeTrades.length > 0 && (
          <div className="absolute right-0 top-0 bottom-0 w-[340px] bg-slate-900/90 backdrop-blur-md border-l border-white/10 z-20 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              
              {/* Header da Lista */}
              <div className="p-3 border-b border-white/5 flex items-center justify-between bg-slate-950/50">
                 <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                       Execuções ({activeTrades.length})
                    </span>
                 </div>
              </div>

              {/* Lista Scrollável */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar pb-20">
                 {activeTrades.map((trade) => (
                    <TradeDisplay 
                       key={trade.id}
                       activeTrade={trade} 
                       currentPrice={currentPrice} 
                    />
                 ))}
              </div>
          </div>
       )}
    </div>
  );
};

export default LiveExecution;