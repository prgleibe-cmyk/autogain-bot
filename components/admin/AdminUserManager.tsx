import React, { useState } from 'react';
// Fix: UserData is a custom type, not a lucide-react icon
import { Search, Edit2 } from 'lucide-react';
import { UserData } from '../../types';

interface AdminUserManagerProps {
  users: UserData[];
  onSelectUser: (user: UserData) => void;
}

const AdminUserManager: React.FC<AdminUserManagerProps> = ({ users, onSelectUser }) => {
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | UserData['status']>('ALL');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          user.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus = userStatusFilter === 'ALL' || user.status === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      <div className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">USUÁRIOS</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em] mt-2">Base de Clientes Autogain</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5">
          {(['ALL', 'ACTIVE', 'BLOCKED', 'TRIAL'] as const).map(status => (
            <button
              key={status}
              onClick={() => setUserStatusFilter(status)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                userStatusFilter === status ? 'bg-gold-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {status === 'ALL' ? 'TODOS' : status === 'ACTIVE' ? 'ATIVOS' : status === 'BLOCKED' ? 'BLOQUEADOS' : 'TESTE'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-white/5">
            <tr>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuário</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Dívida</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Restante</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-bold text-white">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                    {user.isExempt && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[8px] font-black uppercase tracking-widest">ISENTO</span>
                    )}
                  </div>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                    user.status === 'BLOCKED' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {user.status === 'ACTIVE' ? 'ATIVO' : user.status === 'BLOCKED' ? 'BLOQUEADO' : user.status}
                  </span>
                </td>
                <td className="p-6 font-mono text-white text-sm">
                  ${user.profitShareDue.toFixed(2)}
                </td>
                <td className="p-6 font-bold text-slate-400">
                  {user.daysRemaining} dias
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => onSelectUser(user)}
                    className="p-3 bg-slate-800 hover:bg-gold-600 hover:text-slate-950 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserManager;