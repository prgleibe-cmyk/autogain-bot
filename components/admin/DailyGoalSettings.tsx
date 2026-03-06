
import React from 'react';
import { SystemSettings, DailyGoalConfig } from '../../types';
import { Target, Clock, CalendarCheck, AlertTriangle, Save, Power, DollarSign, Percent, Crown } from 'lucide-react';

interface DailyGoalSettingsProps {
    settings: SystemSettings;
    handleSettingChange: (key: keyof SystemSettings, value: any) => void;
    saveConfig: () => void;
}

const DailyGoalSettings: React.FC<DailyGoalSettingsProps> = ({ settings, handleSettingChange, saveConfig }) => {
    const config = settings.dailyGoalConfig || {
        enabled: false,
        type: 'VALUE',
        goalValue: 50.00,
        goalPercent: 10.0,
        returnTime: '08:00',
        lastGoalHitDate: null
    };

    const updateConfig = (field: keyof DailyGoalConfig, value: any) => {
        handleSettingChange('dailyGoalConfig', { ...config, [field]: value });
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-right-4 relative z-10 max-w-5xl mx-auto">
            <div className="flex justify-between items-end pb-8 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">METAS ELITE</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em] mt-2">Controle de Limite Diário Institucional</p>
                </div>
                <button onClick={saveConfig} className="px-10 py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-slate-950 font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-gold-500/20 hover:scale-105 active:scale-95 transition-all">
                    FIXAR OBJETIVO
                </button>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                <div className="absolute -top-10 -right-10 p-10 opacity-5 pointer-events-none">
                     <Target className="w-80 h-80 text-white" />
                </div>

                <div className="flex items-center justify-between bg-slate-950/50 p-8 rounded-[2.5rem] border border-white/5 mb-10 relative z-10">
                    <div className="flex items-center gap-8">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${config.enabled ? 'bg-gold-500 text-slate-950 shadow-gold-500/20' : 'bg-slate-800 text-slate-600'}`}>
                             <Target className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Proteção de Meta Ativa</h3>
                            <p className="text-slate-500 text-sm mt-1 font-medium">O algoritmo encerrará as operações assim que o lucro alvo for consolidado.</p>
                        </div>
                    </div>
                    
                    <button 
                      onClick={() => updateConfig('enabled', !config.enabled)}
                      className={`w-16 h-9 rounded-full transition-all relative ${config.enabled ? 'bg-gold-500 shadow-[0_0_20px_#f59e0b]' : 'bg-slate-800'}`}
                    >
                      <div className={`w-7 h-7 bg-white rounded-full absolute top-1 transition-all ${config.enabled ? 'left-8' : 'left-1'}`}></div>
                    </button>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 transition-all duration-700 ${config.enabled ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
                    <div className="bg-slate-950/40 p-10 rounded-[2.5rem] border border-white/5 space-y-10">
                        <label className="text-[10px] font-black text-gold-500 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Crown className="w-4 h-4" /> DEFINIÇÃO DE LUCRO (TAKE)
                        </label>
                        
                        <div className="flex bg-slate-900 p-2 rounded-2xl border border-white/5">
                             <button 
                                 onClick={() => updateConfig('type', 'VALUE')}
                                 className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${config.type === 'VALUE' ? 'bg-gold-500 text-slate-950' : 'text-slate-600'}`}
                             >
                                 <DollarSign className="w-4 h-4 inline mr-2" /> VALOR FIXO ($)
                             </button>
                             <button 
                                 onClick={() => updateConfig('type', 'PERCENT')}
                                 className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${config.type === 'PERCENT' ? 'bg-gold-500 text-slate-950' : 'text-slate-600'}`}
                             >
                                 <Percent className="w-4 h-4 inline mr-2" /> PERCENTUAL (%)
                             </button>
                        </div>

                        <div className="relative">
                            <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gold-500 font-black text-3xl">
                                {config.type === 'VALUE' ? '$' : '%'}
                            </span>
                            <input 
                                type="number" 
                                value={isNaN(config.type === 'VALUE' ? config.goalValue : config.goalPercent) ? '' : (config.type === 'VALUE' ? config.goalValue : config.goalPercent)}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    updateConfig(config.type === 'VALUE' ? 'goalValue' : 'goalPercent', isNaN(val) ? 0 : val);
                                }}
                                className="w-full bg-slate-900 border border-white/10 rounded-[2rem] px-8 pl-16 py-8 text-4xl font-mono text-white outline-none focus:border-gold-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-950/40 p-10 rounded-[2.5rem] border border-white/5 space-y-10">
                        <label className="text-[10px] font-black text-gold-500 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Clock className="w-4 h-4" /> HORÁRIO DE RETORNO
                        </label>
                        <input 
                            type="time" 
                            value={config.returnTime}
                            onChange={(e) => updateConfig('returnTime', e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-[2rem] px-8 py-8 text-4xl font-mono text-white outline-none focus:border-gold-500 transition-colors text-center"
                        />
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed text-center px-10">
                            Janela de reinicialização automática do robô no dia subsequente.
                        </p>
                    </div>
                </div>

                {config.lastGoalHitDate && (
                    <div className="mt-12 p-8 bg-gold-500/10 border border-gold-500/30 rounded-[2.5rem] flex items-center gap-8 shadow-2xl animate-pulse">
                        <div className="p-5 bg-gold-500 text-slate-950 rounded-[1.5rem] shadow-2xl shadow-gold-500/30">
                            <CalendarCheck className="w-10 h-10" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-2xl font-black text-gold-400 uppercase tracking-tighter">Meta Consolidada</h4>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                                SISTEMA EM HIBERNAÇÃO DESDE {config.lastGoalHitDate}. PRÓXIMO INÍCIO: {config.returnTime}.
                            </p>
                        </div>
                        <button 
                            onClick={() => updateConfig('lastGoalHitDate', null)}
                            className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-gold-500 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-gold-500/20 transition-all"
                        >
                            FORÇAR RESET
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyGoalSettings;
