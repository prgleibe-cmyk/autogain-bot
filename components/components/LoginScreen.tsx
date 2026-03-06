import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, Mail, User, Zap, Coins, ShieldAlert } from 'lucide-react';
import EliteLogo from './EliteLogo';

interface LoginScreenProps {
  onLoginSuccess: (email: string, isTrial: boolean, daysRemaining: number, role: 'USER' | 'ADMIN') => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (email.includes('@') && email.length > 5) {
      const users = JSON.parse(localStorage.getItem('registered_traders') || '{}');
      setIsNewUser(!users[email.toLowerCase()]);
    }
  }, [email]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    setTimeout(() => {
      const lowerEmail = email.toLowerCase();
      const users = JSON.parse(localStorage.getItem('registered_traders') || '{}');
      
      if (isNewUser) {
        if (name.length < 3) {
          setError('Por favor, insira seu nome completo.');
          setIsLoading(false);
          return;
        }
        users[lowerEmail] = { name, joinedAt: Date.now() };
        localStorage.setItem('registered_traders', JSON.stringify(users));
      }

      if (lowerEmail === 'gleibeswk@gmail.com') {
         onLoginSuccess(email, false, 999, 'ADMIN');
      } else {
         onLoginSuccess(email, true, 7, 'USER');
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex flex-col lg:flex-row font-sans relative overflow-x-hidden">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-10"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold-500/10 blur-[120px] rounded-full animate-pulse"></div>
      </div>

      {/* LEFT COLUMN: BRANDING */}
      <div className="hidden lg:flex flex-col w-[50%] xl:w-[55%] p-12 z-10 relative border-r border-white/5 bg-slate-950/20 backdrop-blur-3xl justify-center items-center">
        <div className="max-w-4xl w-full py-12 space-y-12 flex flex-col items-center text-center">
          
          <div className="inline-flex items-center gap-4 bg-gold-600/10 border border-gold-600/30 px-8 py-3 rounded-full text-[11px] font-black text-gold-500 uppercase tracking-[0.4em] animate-in fade-in slide-in-from-top-4 duration-700">
             Financial Intelligence Engine v2.5
          </div>
          
          {/* Logo Principal ajustada */}
          <div className="relative flex flex-col items-center">
            <EliteLogo size="xl" showText={false} className="drop-shadow-[0_0_80px_rgba(245,158,11,0.15)]" />
          </div>

          <div className="grid grid-cols-2 gap-10 w-full px-16">
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10 space-y-4 group hover:border-gold-500/40 transition-all duration-500 flex flex-col items-center shadow-xl">
              <Coins className="w-12 h-12 text-gold-500 group-hover:scale-110 transition-transform mb-2" />
              <div className="text-2xl font-black text-white uppercase tracking-tighter">Market Dominance</div>
              <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-[0.2em]">Players de alta performance.</p>
            </div>
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10 space-y-4 group hover:border-gold-500/40 transition-all duration-500 flex flex-col items-center shadow-xl">
              <ShieldCheck className="w-12 h-12 text-gold-500 group-hover:scale-110 transition-transform mb-2" />
              <div className="text-2xl font-black text-white uppercase tracking-tighter">Secure Assets</div>
              <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-[0.2em]">Execução Institucional Direta.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 z-10 min-h-screen">
        <div className="w-full max-w-lg py-8 space-y-10 my-auto"> {/* Alterado de max-w-md para max-w-lg */}
          <div className="bg-slate-900/50 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-12 sm:p-16 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
            
            <div className="mb-12 text-center">
              <div className="lg:hidden mb-10 flex justify-center">
                <EliteLogo size="lg" showText={false} />
              </div>
              <h2 className="text-4xl xl:text-5xl font-black text-white uppercase tracking-tighter italic">
                {isNewUser ? 'Acessar' : 'Entrar'}
              </h2>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.5em] mt-4">
                {isNewUser ? 'Inicie sua Jornada de Elite' : 'Conecte-se ao seu Terminal'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-8">
              <div className="space-y-5">
                <div className="relative group">
                  <Mail className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600 group-focus-within:text-gold-500 transition-colors" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-20 bg-slate-950/80 border border-slate-800 rounded-3xl pl-16 pr-8 text-white placeholder:text-slate-700 focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-500/5 transition-all font-bold text-xl" 
                    placeholder="E-mail Institucional"
                  />
                </div>

                {isNewUser && email.includes('@') && (
                  <div className="relative group animate-in slide-in-from-top-4 fade-in duration-500">
                    <User className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600 group-focus-within:text-gold-500 transition-colors" />
                    <input 
                      type="text" 
                      required={isNewUser}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-20 bg-slate-950/80 border border-slate-800 rounded-3xl pl-16 pr-8 text-white placeholder:text-slate-700 focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-500/5 transition-all font-bold text-xl" 
                      placeholder="Nome Completo"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-4 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                   <ShieldAlert className="w-6 h-6 shrink-0" />
                   {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-20 bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-slate-950 font-black text-lg uppercase tracking-[0.4em] rounded-3xl transition-all flex items-center justify-center gap-4 shadow-2xl shadow-gold-500/30 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-7 h-7 fill-current" />
                    {isNewUser ? 'REGISTRAR' : 'AUTENTICAR'}
                  </>
                )}
              </button>
            </form>
          </div>
          
          <p className="text-center text-slate-700 text-[10px] font-bold uppercase tracking-[0.4em] pb-6">
            Autogain Algorithm v2.5.0 • Institutional Grade Terminal
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;