
import React from 'react';
import { useBotContext } from '../context/BotContext';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, LogOut, ShieldCheck, Settings, Bell, Crown } from 'lucide-react';
import { TradeResult } from '../types';
import EliteLogo from './EliteLogo';

interface TopBarProps {
  isTrialMode: boolean;
  daysRemaining: number;
  handleLogout: () => void;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  isTrialMode,
  daysRemaining,
  handleLogout,
  isAdmin,
  onOpenAdmin
}) => {
  
  const { 
    wallet, isBrokerConnected, totalProfit,
    userEmail
  } = useBotContext();

  return (
    <div className="h-16 lg:h-20 border-b border-white/5 bg-slate-950/80 backdrop-blur-3xl flex items-center justify-between px-4 lg:px-8 z-50 shrink-0">
       
       {/* LEFT: BRANDING */}
       <div className="flex items-center gap-2 lg:gap-4">
          <EliteLogo size="sm" showText={false} className="!h-8 !w-8 lg:!h-10 lg:!w-10" />
          <div className="flex flex-col">
            <h1 className="font-black text-lg lg:text-2xl text-white leading-none tracking-tighter uppercase italic">
              AUTO<span className="text-gold-500">GAIN</span>
            </h1>
          </div>
       </div>

       {/* CENTER: PERFORMANCE */}
       <div className="flex-1 flex items-center justify-center gap-4 lg:gap-12">
          <div className="flex flex-col items-center">
            <div className="text-sm lg:text-xl font-mono font-black text-white flex items-center gap-2">
              <WalletIcon className="w-3 h-3 lg:w-4 lg:h-4 text-gold-500" />
              {isBrokerConnected ? `${wallet.balance.toFixed(2)}` : '---'}
            </div>
            <span className="text-[7px] text-slate-600 uppercase font-black lg:hidden">SALDO</span>
          </div>

          <div className="h-6 lg:h-8 w-px bg-white/10"></div>

          <div className="flex flex-col items-center">
            <div className={`text-sm lg:text-xl font-mono font-black flex items-center gap-2 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalProfit >= 0 ? <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4" /> : <TrendingDown className="w-3 h-3 lg:w-4 lg:h-4" />}
              {totalProfit.toFixed(2)}
            </div>
            <span className="text-[7px] text-slate-600 uppercase font-black lg:hidden">LUCRO</span>
          </div>
       </div>
       
       {/* RIGHT: USER */}
       <div className="flex items-center gap-2 lg:gap-6">
          <div className="hidden lg:flex items-center gap-3 border-r border-white/10 pr-6">
             <button className="p-2.5 bg-white/5 rounded-xl text-slate-500 transition-all border border-white/5">
                <Bell className="w-4 h-4" />
             </button>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
             {isAdmin && onOpenAdmin && (
               <button 
                 onClick={onOpenAdmin}
                 className="p-2 lg:p-3 bg-gold-600 text-slate-950 rounded-lg lg:rounded-xl flex items-center gap-2"
               >
                 <ShieldCheck className="w-3 h-3 lg:w-4 lg:h-4" />
               </button>
             )}

             <button 
               onClick={handleLogout} 
               className="p-2 lg:p-3 bg-rose-500/10 text-rose-500 rounded-lg lg:rounded-xl border border-rose-500/20"
             >
               <LogOut className="w-3 h-3 lg:w-4 lg:h-4" />
             </button>
          </div>
       </div>
    </div>
  );
};

export default React.memo(TopBar);
