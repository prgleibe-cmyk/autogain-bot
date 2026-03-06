
import React from 'react';
import { StrategyDefinition, SystemSettings } from '../../types';
import { STRATEGIES_REPOSITORY } from '../../data/strategies';
import { Settings2, Percent, DollarSign } from 'lucide-react';

interface AdminStrategyManagerProps {
  settings: SystemSettings;
  toggleStrategy: (id: string) => void;
  saveConfig: () => void;
  onUpdateStrategyConfig?: (id: string, config: any) => void;
}

const AdminStrategyManager: React.FC<AdminStrategyManagerProps> = ({ settings, toggleStrategy, saveConfig, onUpdateStrategyConfig }) => {
  const isPerStrategyMode = settings.entryManagementMode === 'STRATEGY';

  const renderStrategyRow = (strat: StrategyDefinition) => {
    const isEnabled = settings.enabledStrategies[strat.id];
    const stats = settings.strategyStats?.[strat.id] || { wins: 0, losses: 0, profit: 0 };
    const winRate = (stats.wins + stats.losses) > 0 ? (stats.wins / (stats.wins + stats.losses)) * 100 : 0;
    
    // Configurações customizadas da estratégia
    const customConfig = settings.strategyCustomConfigs?.[strat.id] || { 
        entryType: settings.entryType, 
        entryValue: settings.entryType === 'FIXED' ? settings.entryFixedValue : settings.entryPercent 
    };

    return (
      <tr key={strat.id} className={`border-b border-white/5 transition-colors ${isEnabled ? 'bg-gold-500/5 hover:bg-gold-500/10' : 'bg-slate-950 opacity-40'}`}>
        <td className="p-4 w-16 text-center">
          <button onClick={() => toggleStrategy(strat.id)} className={`w-10 h-5 rounded-full transition-all relative ${isEnabled ? 'bg-gold-500' : 'bg-slate-700'}`}>
            <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-all ${isEnabled ? 'left-6' : 'left-1'}`}></div>
          </button>
        </td>
        <td className="p-4">
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white">{strat.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">{strat.id}</span>
          </div>
        </td>
        <td className="p-4">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${strat.timeframe === 'M1' ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
            {strat.timeframe}
          </span>
        </td>
        
        {/* Coluna de Configuração Individual (Condicional) */}
        {isPerStrategyMode && (
            <td className="p-4 min-w-[180px]">
                <div className="flex items-center gap-2 bg-slate-950 border border-white/5 p-1 rounded-xl">
                    <button 
                        onClick={() => {
                            const newConfigs = { ...settings.strategyCustomConfigs, [strat.id]: { ...customConfig, entryType: 'FIXED' } };
                            if (onUpdateStrategyConfig) onUpdateStrategyConfig(strat.id, newConfigs[strat.id]);
                        }}
                        className={`p-2 rounded-lg ${customConfig.entryType === 'FIXED' ? 'bg-gold-500 text-slate-950' : 'text-slate-600'}`}
                    >
                        <DollarSign className="w-3 h-3" />
                    </button>
                    <button 
                        onClick={() => {
                            const newConfigs = { ...settings.strategyCustomConfigs, [strat.id]: { ...customConfig, entryType: 'PERCENT' } };
                            if (onUpdateStrategyConfig) onUpdateStrategyConfig(strat.id, newConfigs[strat.id]);
                        }}
                        className={`p-2 rounded-lg ${customConfig.entryType === 'PERCENT' ? 'bg-gold-500 text-slate-950' : 'text-slate-600'}`}
                    >
                        <Percent className="w-3 h-3" />
                    </button>
                    <input 
                        type="number"
                        step="0.1"
                        value={isNaN(customConfig.entryValue) ? '' : customConfig.entryValue}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const newConfigs = { ...settings.strategyCustomConfigs, [strat.id]: { ...customConfig, entryValue: isNaN(val) ? 0 : val } };
                            if (onUpdateStrategyConfig) onUpdateStrategyConfig(strat.id, newConfigs[strat.id]);
                        }}
                        className="bg-transparent text-white font-mono text-xs w-full outline-none text-right pr-2"
                    />
                </div>
            </td>
        )}

        <td className="p-4 max-w-xs"><p className="text-xs text-slate-400 line-clamp-1">{strat.description}</p></td>
        <td className="p-4 min-w-[120px]">
          <div className="flex items-center justify-between text-[10px] mb-1 font-bold uppercase text-slate-500">
            <span>Eficiência ({stats.wins}W / {stats.losses}L)</span>
            <span className={winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>{winRate.toFixed(1)}%</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gold-500" style={{ width: `${winRate}%` }}></div>
          </div>
        </td>
        <td className="p-4 text-right font-mono font-bold text-sm text-white">${stats.profit.toFixed(2)}</td>
      </tr>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      <div className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">ALGORITMOS</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em] mt-2">
              {isPerStrategyMode ? 'Gestão Individual por Estratégia Ativa' : 'Repositório Estratégico Global'}
          </p>
        </div>
        <button onClick={saveConfig} className="px-10 py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-slate-950 font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-gold-500/20 hover:scale-105 active:scale-95 transition-all">
          SALVAR REPOSITÓRIO
        </button>
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-3xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950 border-b border-white/5">
            <tr>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estratégia</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">TF</th>
              {isPerStrategyMode && <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Config Entrada</th>}
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lógica</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Eficiência</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Lucro Acum.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {STRATEGIES_REPOSITORY.map(renderStrategyRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminStrategyManager;
