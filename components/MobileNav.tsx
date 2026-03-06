
import React from 'react';
import { LayoutDashboard, Activity, History, Settings, Zap } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBotRunning: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, isBotRunning }) => {
  const tabs = [
    { id: 'scanner', label: 'Scanner', icon: LayoutDashboard },
    { id: 'trades', label: 'Operações', icon: Zap },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'config', label: 'Gestão', icon: Settings },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 px-6 pb-6 pt-3 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive ? 'text-gold-500 scale-110' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className={`p-2 rounded-xl ${isActive ? 'bg-gold-500/10' : ''}`}>
              <tab.icon className={`w-6 h-6 ${isActive && tab.id === 'trades' && isBotRunning ? 'animate-pulse' : ''}`} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileNav;
