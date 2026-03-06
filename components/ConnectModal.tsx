
import React, { useState, useEffect } from 'react';
import { Broker } from '../types';
import { bridgeApi } from '../services/bridgeApi'; 
import { X, ShieldCheck, Loader2, CheckCircle2, Server, Globe, AlertCircle, Info } from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  broker: Broker;
  onConnect: (initialBalance: number, accountType: 'REAL' | 'DEMO', selectedBroker: Broker) => void;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, broker: initialBroker, onConnect }) => {
  const [selectedBroker, setSelectedBroker] = useState<Broker>(initialBroker);
  const [brokerEmail, setBrokerEmail] = useState('');
  const [brokerPassword, setBrokerPassword] = useState('');
  const [accountType, setAccountType] = useState<'REAL' | 'DEMO'>('REAL');
  
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'LOGIN' | 'CONNECTING' | 'SUCCESS'>('LOGIN');
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setStep('CONNECTING');

    try {
      const data = await bridgeApi.connect({
        email: brokerEmail,
        password: brokerPassword,
        broker: selectedBroker,
        type: accountType === 'DEMO' ? 'PRACTICE' : 'REAL'
      });

      setStep('SUCCESS');
      setTimeout(() => {
        onConnect(data.balance || 0, accountType, selectedBroker);
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Falha no Login ou IP Bloqueado.');
      setStep('LOGIN');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="bg-slate-800/50 p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
            <ShieldCheck className="w-5 h-5 text-gold-500" />
            Conectar Corretora
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8">
          {step === 'LOGIN' && (
            <form onSubmit={handleConnect} className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setAccountType('REAL')} className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${accountType === 'REAL' ? 'bg-gold-500/10 border-gold-500 text-gold-500' : 'bg-slate-950 border-white/5 text-slate-600'}`}>Conta Real</button>
                  <button type="button" onClick={() => setAccountType('DEMO')} className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${accountType === 'DEMO' ? 'bg-gold-500/10 border-gold-500 text-gold-500' : 'bg-slate-950 border-white/5 text-slate-600'}`}>Treinamento</button>
                </div>
                
                <div className="space-y-3">
                   <input type="email" required value={brokerEmail} onChange={e => setBrokerEmail(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-gold-500" placeholder="E-mail" />
                   <input type="password" required value={brokerPassword} onChange={e => setBrokerPassword(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-gold-500" placeholder="Senha" />
                </div>

                {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold rounded-2xl flex items-center gap-3"><AlertCircle className="w-4 h-4" /> {error}</div>}

                <button type="submit" disabled={isLoading} className="w-full py-5 rounded-2xl bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] shadow-xl disabled:opacity-30">
                   {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Conectar Terminal"}
                </button>

                <div className="flex items-start gap-2 p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
                   <Info className="w-3 h-3 text-cyan-500 shrink-0 mt-0.5" />
                   <p className="text-[9px] text-slate-500 leading-relaxed font-bold uppercase italic">Conexão direta institucional ativa.</p>
                </div>
            </form>
          )}

          {step === 'CONNECTING' && (
             <div className="py-20 flex flex-col items-center justify-center space-y-6">
                <Loader2 className="w-12 h-12 animate-spin text-gold-500" />
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Sincronizando Corredor...</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Tentando conexão via porta segura direta</p>
             </div>
          )}

          {step === 'SUCCESS' && (
             <div className="py-20 flex flex-col items-center justify-center space-y-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                <h3 className="text-2xl font-black text-white uppercase italic">Sucesso</h3>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;
