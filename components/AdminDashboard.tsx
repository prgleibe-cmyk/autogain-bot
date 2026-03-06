
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, PieChart, Settings, LogOut, ArrowLeft,
  Users, Sliders, Target, Crown
} from 'lucide-react';
import { SystemSettings, OptionType, UserData } from '../types';
import { DEFAULT_SYSTEM_SETTINGS } from '../constants';

// Subcomponentes Modulares
import UserEditModal from './admin/UserEditModal';
import SettingsForm from './admin/SettingsForm';
import DailyGoalSettings from './admin/DailyGoalSettings';
import MarketFilterSettings from './admin/MarketFilterSettings';
import AdminOverview from './admin/AdminOverview';
import AdminStrategyManager from './admin/AdminStrategyManager';
import AdminUserManager from './admin/AdminUserManager';

interface AdminDashboardProps {
  onLogout: () => void;
  onBackToSystem: () => void;
  onUpdateSettings: (settings: SystemSettings) => void;
}

const generateMockUsers = (): UserData[] => [
  { id: 'usr_admin', name: 'ADMIN MASTER', email: 'gleibeswk@gmail.com', status: 'ACTIVE', daysRemaining: 999, profitShareDue: 0, customCommissionRate: 0, joinedAt: Date.now(), isBotRunning: true, isExempt: true },
  { id: 'usr_01', name: 'Carlos Silva', email: 'carlos.trader@gmail.com', status: 'ACTIVE', daysRemaining: 15, profitShareDue: 0, customCommissionRate: 15, joinedAt: Date.now() - 86400000 * 5, isBotRunning: true, isExempt: false },
  { id: 'usr_02', name: 'Ana Beatriz', email: 'ana.bea@hotmail.com', status: 'BLOCKED', daysRemaining: 0, profitShareDue: 150.50, joinedAt: Date.now() - 86400000 * 12, isBotRunning: false, isExempt: true },
  { id: 'usr_03', name: 'Marcos Paulo', email: 'marcos.p@yahoo.com', status: 'TRIAL', daysRemaining: 3, profitShareDue: 0, joinedAt: Date.now() - 86400000 * 2, isBotRunning: true, isExempt: false },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onBackToSystem, onUpdateSettings }) => {
  const [activeView, setActiveView] = useState<'OVERVIEW' | 'GENERAL' | 'STRATEGIES' | 'USERS' | 'DAILY_GOAL' | 'MARKET_FILTERS'>('OVERVIEW');
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bot_system_settings');
    if (saved) setSettings({ ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(saved) });
    setUsers(generateMockUsers());
  }, []);

  const saveConfig = () => {
    console.log("💾 SALVANDO CONFIGURAÇÕES NO STORAGE:", settings);
    localStorage.setItem('bot_system_settings', JSON.stringify(settings));
    onUpdateSettings(settings);
    alert("Configurações aplicadas com sucesso!");
  };

  const handleSettingChange = (key: keyof SystemSettings, value: any) => setSettings(prev => ({ ...prev, [key]: value }));

  const toggleStrategy = (id: string) => {
    setSettings(prev => ({
        ...prev,
        enabledStrategies: { ...prev.enabledStrategies, [id]: !prev.enabledStrategies[id] }
    }));
  };

  const navItems = [
    { id: 'OVERVIEW', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'GENERAL', label: 'Configurações', icon: Settings },
    { id: 'MARKET_FILTERS', label: 'Filtros de Mercado', icon: Sliders },
    { id: 'DAILY_GOAL', label: 'Meta Diária', icon: Target },
    { id: 'STRATEGIES', label: 'Algoritmos', icon: PieChart },
    { id: 'USERS', label: 'Usuários', icon: Users }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Navegação Lateral */}
      <div className="w-72 bg-slate-900 border-r border-white/5 flex flex-col shrink-0 z-20">
        <div className="p-8 border-b border-white/5 bg-slate-950/20">
            <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter italic">
                AUTO<span className="text-gold-500">GAIN</span>
                <Crown className="w-5 h-5 text-gold-500" />
            </h2>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 block">Terminal de Controle v2.5</span>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActiveView(item.id as any)} 
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-widest ${activeView === item.id ? 'bg-gold-600 text-slate-950 shadow-xl shadow-gold-500/20' : 'text-slate-500 hover:bg-white/5'}`}
                >
                    <item.icon className="w-5 h-5" /> {item.label}
                </button>
            ))}
        </nav>
        <div className="p-6 border-t border-white/5 space-y-3">
            <button onClick={onBackToSystem} className="w-full flex items-center gap-3 justify-center px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar ao Robô
            </button>
            <button onClick={onLogout} className="w-full flex items-center gap-3 justify-center px-4 py-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors">
                <LogOut className="w-4 h-4" /> Sair do Painel
            </button>
        </div>
      </div>

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto p-12 bg-slate-950 relative custom-scrollbar">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
        <div className="relative z-10 max-w-6xl mx-auto space-y-12">
            
            {activeView === 'OVERVIEW' && <AdminOverview users={users} />}

            {activeView === 'STRATEGIES' && (
              <AdminStrategyManager 
                settings={settings} 
                toggleStrategy={toggleStrategy} 
                saveConfig={saveConfig} 
                onUpdateStrategyConfig={(id, config) => {
                    setSettings(prev => ({
                        ...prev,
                        strategyCustomConfigs: { ...prev.strategyCustomConfigs, [id]: config }
                    }));
                }}
                onResetStrategyStats={(id) => {
                    setSettings(prev => ({
                        ...prev,
                        strategyStats: { ...prev.strategyStats, [id]: { wins: 0, losses: 0, profit: 0 } }
                    }));
                }}
                onResetAllStrategies={() => {
                    setSettings(prev => ({
                        ...prev,
                        strategyCustomConfigs: {},
                        strategyStats: {}
                    }));
                }}
              />
            )}

            {activeView === 'USERS' && (
              <AdminUserManager 
                users={users} 
                onSelectUser={setSelectedUser} 
              />
            )}

            {activeView === 'GENERAL' && (
                <SettingsForm 
                    settings={settings} 
                    handleSettingChange={handleSettingChange} 
                    saveConfig={saveConfig}
                    toggleOptionType={(type) => {
                        const current = settings.allowedOptionTypes || [];
                        const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
                        handleSettingChange('allowedOptionTypes', next);
                    }}
                />
            )}

            {activeView === 'MARKET_FILTERS' && (
                <MarketFilterSettings 
                    settings={settings} 
                    handleSettingChange={handleSettingChange} 
                    saveConfig={saveConfig} 
                />
            )}

            {activeView === 'DAILY_GOAL' && (
                <DailyGoalSettings 
                    settings={settings} 
                    handleSettingChange={handleSettingChange} 
                    saveConfig={saveConfig} 
                />
            )}
        </div>
        
        {selectedUser && (
            <UserEditModal 
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser as any}
                onClose={() => setSelectedUser(null)}
                onSave={(updated) => {
                    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                    setSelectedUser(null);
                }}
            />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
