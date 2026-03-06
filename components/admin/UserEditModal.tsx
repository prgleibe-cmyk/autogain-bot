
import React from 'react';
import { UserData } from '../../types';
import { UserCog, Calendar, DollarSign, Save, X, Shield, Percent, RotateCcw, Crown, ShieldOff } from 'lucide-react';

interface UserEditModalProps {
  selectedUser: UserData;
  onClose: () => void;
  onSave: (user: UserData) => void;
  setSelectedUser: React.Dispatch<React.SetStateAction<UserData | null>>;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ selectedUser, onClose, onSave, setSelectedUser }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
       <div className="w-full max-w-2xl bg-slate-900 border border-white/5 rounded-[3rem] shadow-[0_0_100px_rgba(245,158,11,0.1)] overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gold-500/10 rounded-[1.5rem] flex items-center justify-center border border-gold-500/20">
                   <UserCog className="w-8 h-8 text-gold-500" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter">GERENCIAR TRADER</h3>
                   <p className="text-slate-500 font-mono text-xs">{selectedUser.email}</p>
                </div>
             </div>
             <button onClick={onClose} className="p-4 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
          </div>
          
          <div className="p-10 space-y-10">
             {/* Controle de Status */}
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Status da Licença / Autenticação</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                   {[
                       { id: 'ACTIVE', label: 'ATIVO' },
                       { id: 'BLOCKED', label: 'BLOQUEADO' },
                       { id: 'TRIAL', label: 'TESTE (TRIAL)' },
                       { id: 'PAYMENT_PENDING', label: 'PGTO PENDENTE' }
                   ].map(status => (
                      <button
                         key={status.id}
                         type="button"
                         onClick={() => setSelectedUser({...selectedUser, status: status.id as any})}
                         className={`py-4 rounded-xl border text-[10px] font-black transition-all uppercase tracking-widest ${
                            selectedUser.status === status.id 
                            ? 'bg-gold-500 border-gold-500 text-slate-950 shadow-xl shadow-gold-500/20' 
                            : 'bg-slate-950 border-white/5 text-slate-600 hover:text-slate-400'
                         }`}
                      >
                         {status.label}
                      </button>
                   ))}
                </div>
             </div>

             {/* Isenção de Percentual */}
             <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className={`p-4 rounded-2xl transition-all ${selectedUser.isExempt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      {selectedUser.isExempt ? <Shield className="w-6 h-6" /> : <ShieldOff className="w-6 h-6" />}
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">Isenção de Comissão</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Usuário não pagará taxa sobre lucro</p>
                   </div>
                </div>
                <button
                   onClick={() => setSelectedUser({...selectedUser, isExempt: !selectedUser.isExempt})}
                   className={`w-14 h-8 rounded-full transition-all relative ${selectedUser.isExempt ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                   <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${selectedUser.isExempt ? 'left-7' : 'left-1'}`}></div>
                </button>
             </div>

             <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-3">
                      <Calendar className="w-3.5 h-3.5" /> Dias Restantes
                   </label>
                   <div className="flex items-center gap-4 bg-slate-950 p-2 rounded-2xl border border-white/5">
                      <button type="button" onClick={() => setSelectedUser({...selectedUser, daysRemaining: Math.max(0, selectedUser.daysRemaining - 1)})} className="w-12 h-12 bg-slate-800 rounded-xl hover:bg-gold-500 hover:text-slate-950 transition-all font-black text-xl">-</button>
                      <input 
                         type="number" 
                         value={selectedUser.daysRemaining}
                         onChange={(e) => setSelectedUser({...selectedUser, daysRemaining: parseInt(e.target.value)})}
                         className="flex-1 bg-transparent text-center text-2xl font-mono font-black text-white outline-none"
                      />
                      <button type="button" onClick={() => setSelectedUser({...selectedUser, daysRemaining: selectedUser.daysRemaining + 1})} className="w-12 h-12 bg-slate-800 rounded-xl hover:bg-gold-500 hover:text-slate-950 transition-all font-black text-xl">+</button>
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-3">
                      <DollarSign className="w-3.5 h-3.5" /> Saldo Devedor
                   </label>
                   <div className="flex gap-4">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500 font-black text-xl">$</span>
                            <input 
                                type="number" 
                                value={selectedUser.profitShareDue}
                                onChange={(e) => setSelectedUser({...selectedUser, profitShareDue: parseFloat(e.target.value)})}
                                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xl font-mono font-black text-white outline-none focus:border-gold-500 transition-colors"
                            />
                        </div>
                        <button 
                            type="button"
                            onClick={() => setSelectedUser({...selectedUser, profitShareDue: 0})}
                            className="p-4 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 rounded-2xl border border-rose-500/20 transition-all"
                            title="Zerar Dívida"
                        >
                            <RotateCcw className="w-6 h-6" />
                        </button>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-3">
                   <Percent className="w-3.5 h-3.5 text-gold-500" /> Taxa de Comissão Customizada (%)
                </label>
                <div className="relative">
                   <input 
                      type="number" 
                      disabled={selectedUser.isExempt}
                      value={selectedUser.isExempt ? 0 : (selectedUser.customCommissionRate || '')}
                      onChange={(e) => setSelectedUser({...selectedUser, customCommissionRate: e.target.value ? parseFloat(e.target.value) : undefined})}
                      className={`w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-6 text-xl font-mono font-black text-white outline-none focus:border-gold-500 transition-colors ${selectedUser.isExempt ? 'opacity-30 cursor-not-allowed' : ''}`}
                      placeholder={selectedUser.isExempt ? "USUÁRIO ISENTO" : "USANDO PADRÕES GLOBAIS"}
                   />
                </div>
             </div>
          </div>

          <div className="p-10 bg-slate-950/40 border-t border-white/5 flex justify-end gap-6">
             <button type="button" onClick={onClose} className="px-8 py-4 text-xs font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors">CANCELAR</button>
             <button type="button" onClick={() => onSave(selectedUser)} className="px-10 py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-slate-950 font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-gold-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                <Save className="w-5 h-5" /> PERSISTIR DADOS
             </button>
          </div>
       </div>
    </div>
  );
};

export default UserEditModal;
