
import React, { useEffect, useState } from 'react';
import { SystemSettings, MarketFilterSettings as IMarketFilterSettings } from '../../types';
import { Sliders, Activity, Clock, BarChart2, TrendingUp, AlertTriangle, Save, Power, BrainCircuit, Lock, Crown } from 'lucide-react';

interface MarketFilterSettingsProps {
    settings: SystemSettings;
    handleSettingChange: (key: keyof SystemSettings, value: any) => void;
    saveConfig: () => void;
}

const MarketFilterSettings: React.FC<MarketFilterSettingsProps> = ({ settings, handleSettingChange, saveConfig }) => {
    const [localFilters, setLocalFilters] = useState<IMarketFilterSettings>(settings.marketFilters || {
        autoCalibration: true,
        timeFilter: false,
        dojiFilter: true,
        wickFilter: false,
        directionFilter: false,
        contextFilter: true,
        maxDojiCount: 4,
        minWickPercent: 5,
        minRangeSize: 0.00005
    });

    useEffect(() => {
        if (settings.marketFilters) {
            setLocalFilters(settings.marketFilters);
        }
    }, [settings.marketFilters]);

    const updateFilter = (field: keyof IMarketFilterSettings, value: any) => {
        const newFilters = { ...localFilters, [field]: value };
        setLocalFilters(newFilters);
        handleSettingChange('marketFilters', newFilters);
    };

    const isLocked = localFilters.autoCalibration;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-right-4 relative z-10 max-w-6xl mx-auto">
            <div className="flex justify-between items-end pb-8 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">FILTROS DE LIQUIDEZ</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em] mt-2">Núcleo de Adaptação à Volatilidade</p>
                </div>
                <button onClick={saveConfig} className="px-10 py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-slate-950 font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-gold-500/20 hover:scale-105 active:scale-95 transition-all">
                    APLICAR FILTROS
                </button>
            </div>

            {/* --- AUTO-CALIBRAGEM IA --- */}
            <div className="bg-gradient-to-br from-gold-950/20 to-slate-900/40 border border-gold-500/30 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl backdrop-blur-3xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)]"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                    <div className="flex items-center gap-8">
                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-700 ${isLocked ? 'bg-gold-500 text-slate-950 shadow-gold-500/30' : 'bg-slate-800 text-slate-500'}`}>
                            <BrainCircuit className={`w-10 h-10 ${isLocked ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Auto-Calibragem Neural</h3>
                            <p className="text-slate-400 text-sm mt-1 max-w-lg leading-relaxed">
                                Deixe a IA monitorar a volatilidade em tempo real. Os filtros serão ajustados automaticamente para evitar ruídos institucionais e manipulações de mercado.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-950/50 p-4 pr-8 rounded-[2rem] border border-white/5">
                       <button 
                          onClick={() => updateFilter('autoCalibration', !localFilters.autoCalibration)}
                          className={`w-16 h-9 rounded-full transition-all relative ${localFilters.autoCalibration ? 'bg-gold-500 shadow-[0_0_20px_#f59e0b]' : 'bg-slate-800'}`}
                       >
                          <div className={`w-7 h-7 bg-white rounded-full absolute top-1 transition-all ${localFilters.autoCalibration ? 'left-8' : 'left-1'}`}></div>
                       </button>
                       <span className={`font-black text-xs uppercase tracking-[0.2em] ${localFilters.autoCalibration ? 'text-gold-400' : 'text-slate-600'}`}>
                           {localFilters.autoCalibration ? 'NEURAL LIGADO' : 'MODO MANUAL'}
                       </span>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative">
                {isLocked && (
                    <div className="absolute inset-0 z-20 bg-slate-950/40 backdrop-blur-[4px] rounded-[3rem] border border-gold-500/10 flex flex-col items-center justify-center text-center p-12 transition-all duration-1000">
                        <div className="bg-slate-900/90 p-12 rounded-[3rem] border border-gold-500/30 shadow-2xl flex flex-col items-center gap-6">
                            <Lock className="w-16 h-16 text-gold-500" />
                            <h4 className="text-3xl font-black text-white uppercase tracking-tighter">GERENCIADO PELA INTELIGÊNCIA</h4>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-sm leading-relaxed">
                                Sensibilidade do mercado operando sob algoritmos adaptativos. Desative a calibragem para controle manual.
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 space-y-10 lg:col-span-2 shadow-2xl">
                    <h3 className="text-xl font-black text-white flex items-center gap-4 pb-4 border-b border-white/5 uppercase">
                        <Activity className="w-6 h-6 text-gold-500" /> Métricas de Atividade Dinâmica
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-slate-950/40 p-10 rounded-[2.5rem] border border-white/5 space-y-6">
                            <div className="flex justify-between items-center">
                                <label className="font-black text-xs uppercase tracking-widest text-slate-500">Filtro de Contexto Global</label>
                                <button 
                                  onClick={() => updateFilter('contextFilter', !localFilters.contextFilter)}
                                  className={`w-12 h-6 rounded-full transition-all relative ${localFilters.contextFilter ? 'bg-gold-500' : 'bg-slate-800'}`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${localFilters.contextFilter ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Range Mínimo de Volatilidade</label>
                                    <div className="text-4xl font-mono font-black text-white tracking-tighter">{localFilters.minRangeSize?.toFixed(5)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950/40 p-10 rounded-[2.5rem] border border-white/5 space-y-6">
                            <div className="flex justify-between items-center">
                                <label className="font-black text-xs uppercase tracking-widest text-slate-500">Filtro de Ruído (Dojis)</label>
                                <button 
                                  onClick={() => updateFilter('dojiFilter', !localFilters.dojiFilter)}
                                  className={`w-12 h-6 rounded-full transition-all relative ${localFilters.dojiFilter ? 'bg-gold-500' : 'bg-slate-800'}`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${localFilters.dojiFilter ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Densidade Máx. de Dojis (5 Velas)</label>
                                    <div className="text-4xl font-mono font-black text-white tracking-tighter">{localFilters.maxDojiCount}x</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 shadow-2xl">
                    <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 pb-4 border-b border-white/5 uppercase">
                        <AlertTriangle className="w-6 h-6 text-gold-500" /> Protocolos de Segurança
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-slate-950/40 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-slate-900 rounded-2xl text-gold-500"><Clock className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="font-black text-sm text-white uppercase tracking-widest">Mapa de Horário Global</h4>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest">BLOQUEIO 22:00 - 00:00 UTC</p>
                                </div>
                            </div>
                            <button onClick={() => updateFilter('timeFilter', !localFilters.timeFilter)} className={`w-12 h-6 rounded-full relative transition-colors ${localFilters.timeFilter ? 'bg-gold-500' : 'bg-slate-800'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${localFilters.timeFilter ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-slate-950/40 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-slate-900 rounded-2xl text-gold-500"><TrendingUp className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="font-black text-sm text-white uppercase tracking-widest">Anti-Tendência Suicida</h4>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest">PROTEÇÃO CONTRA PULLBACK EXTREMO</p>
                                </div>
                            </div>
                            <button onClick={() => updateFilter('directionFilter', !localFilters.directionFilter)} className={`w-12 h-6 rounded-full relative transition-colors ${localFilters.directionFilter ? 'bg-gold-500' : 'bg-slate-800'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${localFilters.directionFilter ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 shadow-2xl">
                    <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 pb-4 border-b border-white/5 uppercase">
                        <BarChart2 className="w-6 h-6 text-gold-500" /> Intensidade de Rejeição
                    </h3>
                    
                    <div className="bg-slate-950/40 p-10 rounded-[2rem] border border-white/5 space-y-10">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gold-500 uppercase tracking-[0.3em]">LIMIAR DE FORÇA DOS PAVIOS (WICK)</label>
                            <span className="text-2xl font-mono font-black text-white">{localFilters.minWickPercent}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="50" 
                            value={localFilters.minWickPercent} 
                            onChange={(e) => updateFilter('minWickPercent', parseInt(e.target.value))}
                            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-gold-500"
                        />
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                            Define o percentual mínimo de pavio exigido para validação de rejeições institucionais.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketFilterSettings;
