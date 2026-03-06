
import React from 'react';
import { useBotContext } from '../context/BotContext';
import { CheckCircle2, AlertOctagon, X } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useBotContext();

  return (
    <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none max-w-[90vw] items-center">
        {toasts.map(toast => (
           <div key={toast.id} className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-start gap-3 w-80 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className={`mt-0.5 p-1 rounded-full ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : toast.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                 {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : toast.type === 'error' ? <AlertOctagon className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                 <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-bold ${toast.type === 'success' ? 'text-emerald-400' : toast.type === 'error' ? 'text-rose-400' : 'text-blue-400'}`}>{toast.title}</h4>
                    <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-white p-1 -mr-2 -mt-2 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
                 </div>
                 <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
                 {toast.amount && <p className="text-sm font-mono font-bold text-white mt-1">{toast.amount}</p>}
              </div>
           </div>
        ))}
    </div>
  );
};

export default ToastContainer;
