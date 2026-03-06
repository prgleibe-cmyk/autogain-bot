
import React from 'react';
import { TimezoneRule, SystemSettings } from '../../types';
import { timezoneService } from '../../services/timezoneService';
import { Map, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface TimezoneSettingsProps {
    settings: SystemSettings;
    handleSettingChange: (key: keyof SystemSettings, value: any) => void;
    saveConfig: () => void;
}

const TimezoneSettings: React.FC<TimezoneSettingsProps> = ({ settings, handleSettingChange, saveConfig }) => {
    
    // Garante que existam regras, se não usa as padrão
    const rules = settings.timezoneRules && settings.timezoneRules.length > 0 
        ? settings.timezoneRules 
        : timezoneService.getDefaultRules();

    // Ordena para exibição (Melhor -> Pior)
    const sortedRules = timezoneService.sortRules(rules);

    const updateRule = (color: string, field: keyof TimezoneRule, value: any) => {
        const newRules = rules.map(r => {
            if (r.color === color) {
                const updated = { ...r, [field]: value };
                return timezoneService.validateRule(updated);
            }
            return r;
        });
        handleSettingChange('timezoneRules', newRules);
    };

    const getColorClass = (color: string) => {
        switch (color) {
            case 'BLUE': return 'bg-blue-500 shadow-blue-500/50';
            case 'GREEN': return 'bg-emerald-500 shadow-emerald-500/50';
            case 'YELLOW': return 'bg-yellow-500 shadow-yellow-500/50';
            case 'WINE': return 'bg-rose-900 shadow-rose-900/50 border border-rose-700';
            case 'RED': return 'bg-rose-600 shadow-rose-600/50';
            case 'BLACK': return 'bg-slate-950 border border-slate-700 shadow-black/50';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 relative z-10 max-w-5xl mx-auto">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Map className="w-8 h-8 text-indigo-400" />
                        Trader Timezone Map
                    </h1>
                    <p className="text-base text-slate-400 mt-1">
                        Configure regras de parada automática baseadas nas cores do mapa.
                    </p>
                </div>
                <button onClick={saveConfig} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95">
                    <CheckCircle2 className="w-5 h-5" /> SALVAR REGRAS
                </button>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                     <Map className="w-64 h-64 text-white" />
                </div>

                <div className="flex items-center gap-2 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-6 text-indigo-300 text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p>
                        As regras abaixo definem quando o robô deve <strong>PARAR</strong> de operar. 
                        Se a opção "Ativar Bloqueio" estiver marcada, o bot entrará em pausa durante a vigência daquela cor.
                    </p>
                </div>

                <div className="space-y-4">
                    {sortedRules.map((rule) => (
                        <div key={rule.color} className={`relative flex flex-col md:flex-row items-start md:items-center gap-4 p-5 rounded-2xl border transition-all ${rule.active ? 'bg-slate-800/80 border-white/10' : 'bg-slate-950/50 border-white/5 opacity-60'}`}>
                            
                            {/* Color Strip Indicator */}
                            <div className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl ${getColorClass(rule.color)}`}></div>

                            {/* Main Info */}
                            <div className="flex-1 pl-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {rule.label}
                                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-white/10 text-slate-400 uppercase tracking-wider">
                                        Prioridade {rule.priority}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    {rule.active 
                                        ? "BLOQUEIO ATIVO: O bot irá parar nestas condições." 
                                        : "BLOQUEIO INATIVO: O bot operará normalmente."}
                                </p>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-end md:items-center">
                                
                                {/* Time Controls */}
                                <div className={`flex gap-3 transition-opacity ${!rule.active ? 'opacity-50' : 'opacity-100'}`}>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Antes (min)
                                        </label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={rule.blockMinutesBefore}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                updateRule(rule.color, 'blockMinutesBefore', isNaN(val) ? 0 : val);
                                            }}
                                            className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white text-center font-mono focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Depois (min)
                                        </label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={rule.blockMinutesAfter}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                updateRule(rule.color, 'blockMinutesAfter', isNaN(val) ? 0 : val);
                                            }}
                                            className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white text-center font-mono focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Active Toggle */}
                                <div className="pl-4 md:border-l border-white/10 h-10 flex items-center">
                                    <button
                                        onClick={() => updateRule(rule.color, 'active', !rule.active)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                            rule.active 
                                            ? 'bg-rose-500/20 border-rose-500 text-rose-400 hover:bg-rose-500/30' 
                                            : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30'
                                        }`}
                                    >
                                        {rule.active ? (
                                            <> <XCircle className="w-4 h-4" /> BLOQUEAR </>
                                        ) : (
                                            <> <CheckCircle2 className="w-4 h-4" /> LIBERAR </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TimezoneSettings;
