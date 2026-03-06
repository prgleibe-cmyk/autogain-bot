
import React from 'react';
import { Users, Activity, DollarSign, Server, Crown } from 'lucide-react';
import { UserData } from '../../types';

interface AdminOverviewProps {
  users: UserData[];
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ users }) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-top-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2rem] space-y-4">
          <Users className="w-10 h-10 text-gold-500" />
          <div>
            <div className="text-3xl font-black text-white">{users.length}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total de Usuários</div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2rem] space-y-4">
          <Activity className="w-10 h-10 text-gold-500" />
          <div>
            <div className="text-3xl font-black text-white">{users.filter(u => u.isBotRunning).length}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bots Online</div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2rem] space-y-4">
          <DollarSign className="w-10 h-10 text-gold-500" />
          <div>
            <div className="text-3xl font-black text-white">$1.450,00</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Comissões Pendentes</div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2rem] space-y-4">
          <Server className="w-10 h-10 text-gold-500" />
          <div>
            <div className="text-3xl font-black text-white">99.9%</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Uptime do Sistema</div>
          </div>
        </div>
      </div>

      <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
        <Crown className="w-20 h-20 text-gold-500 mb-6" />
        <h2 className="text-xl font-black text-white uppercase tracking-[0.5em]">Monitoramento Central Ativo</h2>
      </div>
    </div>
  );
};

export default AdminOverview;
