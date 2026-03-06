
import React from 'react';
import { SystemSettings, RiskMode, OptionType } from '../../types';
import { Save, Globe, CheckCircle2, DollarSign, Percent, Timer, Banknote, Crown, TrendingUp, Zap, Layers, Settings2, Shield } from 'lucide-react';

interface SettingsFormProps {
  settings: SystemSettings;
  handleSettingChange: (key: keyof SystemSettings, value: any) => void;
  toggleOptionType: (type: OptionType) => void;
  saveConfig: () => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ settings, handleSettingChange, toggleOptionType, saveConfig }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 relative z-10">
        <div className="flex justify-between items-end pb-8 border-b border-white/5">
            <div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">AJUSTES DE TRADING</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em] mt-2">Lógica Global & Gestão de Risco</p>
            </div>
            <button onClick={saveConfig} className="px-10 py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-slate-950 font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-gold-500/20 hover:scale-105 active:scale-95 transition-all">
                SALVAR ALTERAÇÕES
            </button>
        </div>

        {/* --- MODO DE RISCO --- */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-8 mb-10 gap-4">
               <div>
                   <h3 className="text-2xl font-black text-white flex items-center gap-4 uppercase tracking-tight">
                      <Settings2 className="w-8 h-8 text-gold-500" />
                      ESTRATÉGIA DE GERENCIAMENTO
                   </h3>
                   <p className="text-sm text-slate-500 mt-1 font-medium">Selecione como o bot deve calcular o valor de cada entrada.</p>
               </div>

               <select 
                    value={settings.riskMode}
                    onChange={(e) => handleSettingChange('riskMode', e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-2xl px-8 py-4 text-white outline-none focus:border-gold-500 font-bold text-sm tracking-widest appearance-none uppercase"
                >
                    <option value={RiskMode.FIXED}>MÃO FIXA (Sempre o mesmo valor)</option>
                    <option value={RiskMode.MARTINGALE}>MARTINGALE (Dobra na perda)</option>
                    <option value={RiskMode.SOROS}>SOROS (Acumula no ganho)</option>
                    <option value={RiskMode.SOROS_GALE}>SOROSGALE (Híbrido Profissional)</option>
                    <option value={RiskMode.MASANIELO}>MASANIELO (Geométrico)</option>
                    <option value={RiskMode.CICLO_3_10}>CICLO 3-10 (Recuperação Longa)</option>
                </select>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Coluna 0: Modo de Gestão */}
               <div className="col-span-full bg-slate-950/40 p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-4">
                       <div className="p-3 bg-gold-500/10 rounded-2xl text-gold-500">
                           <Layers className="w-6 h-6" />
                       </div>
                       <div>
                           <h4 className="font-black text-sm text-white uppercase tracking-widest">Modo de Gestão de Entradas</h4>
                           <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest uppercase">Global (Único para todos) vs Individual (Por algoritmo)</p>
                       </div>
                   </div>
                   <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
                       <button 
                           type="button"
                           onClick={() => handleSettingChange('entryManagementMode', 'GLOBAL')}
                           className={`px-8 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${settings.entryManagementMode === 'GLOBAL' ? 'bg-gold-500 text-slate-950 shadow-lg shadow-gold-500/20' : 'text-slate-600'}`}
                       >
                           GLOBAL
                       </button>
                       <button 
                           type="button"
                           onClick={() => handleSettingChange('entryManagementMode', 'STRATEGY')}
                           className={`px-8 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${settings.entryManagementMode === 'STRATEGY' ? 'bg-gold-500 text-slate-950 shadow-lg shadow-gold-500/20' : 'text-slate-600'}`}
                       >
                           POR ALGORITMO
                       </button>
                   </div>
               </div>

               {/* Coluna 1: Valor da Entrada */}
               <div className="space-y-6">
                   <div className="flex justify-between items-center">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                           Valor da Entrada Base
                       </label>
                       
                       <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
                            <button 
                                type="button"
                                onClick={() => handleSettingChange('entryType', 'FIXED')}
                                className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${settings.entryType === 'FIXED' ? 'bg-gold-500 text-slate-950' : 'text-slate-600'}`}
                            >
                                FIXO ($)
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleSettingChange('entryType', 'PERCENT')}
                                className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${settings.entryType === 'PERCENT' ? 'bg-gold-500 text-slate-950' : 'text-slate-600'}`}
                            >
                                PERC (%)
                            </button>
                       </div>
                   </div>

                   <div className="relative group">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-500 font-black text-3xl">
                           {settings.entryType === 'FIXED' ? '$' : '%'}
                       </span>
                       <input 
                           type="number" 
                           step="0.1"
                           value={isNaN(settings.entryType === 'FIXED' ? settings.entryFixedValue : settings.entryPercent) ? '' : (settings.entryType === 'FIXED' ? settings.entryFixedValue : settings.entryPercent)}
                           onChange={(e) => {
                               const val = parseFloat(e.target.value);
                               handleSettingChange(settings.entryType === 'FIXED' ? 'entryFixedValue' : 'entryPercent', isNaN(val) ? 0 : val);
                           }}
                           className="w-full bg-slate-950 border border-white/10 rounded-[2rem] px-8 pl-16 py-8 text-4xl font-mono text-white outline-none focus:border-gold-500 transition-colors shadow-inner"
                       />
                   </div>
               </div>

               {/* Coluna 2: Configurações de Recuperação */}
               <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Multiplicador Gale</label>
                            <input 
                                type="number" 
                                step="0.1"
                                value={isNaN(settings.martingaleMultiplier) ? '' : settings.martingaleMultiplier}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    handleSettingChange('martingaleMultiplier', isNaN(val) ? 1 : val);
                                }}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Níveis de Gale</label>
                            <input 
                                type="number" 
                                value={settings.maxMartingaleLevels}
                                onChange={(e) => handleSettingChange('maxMartingaleLevels', parseInt(e.target.value))}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Níveis Soros</label>
                            <input 
                                type="number" 
                                value={settings.sorosLevels}
                                onChange={(e) => handleSettingChange('sorosLevels', parseInt(e.target.value))}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Fator Masanielo</label>
                            <input 
                                type="number" 
                                step="0.1"
                                value={isNaN(settings.masanieloFactor) ? '' : settings.masanieloFactor}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    handleSettingChange('masanieloFactor', isNaN(val) ? 1.4 : val);
                                }}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500"
                            />
                        </div>
                   </div>
               </div>
           </div>
        </div>
    </div>
  );
};

export default SettingsForm;
