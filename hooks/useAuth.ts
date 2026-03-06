
import { useState, useCallback } from 'react';
import { SystemSettings } from '../types';
import { DEFAULT_SYSTEM_SETTINGS, STRATEGIES_REPOSITORY } from '../constants';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [userRole, setUserRole] = useState<'USER' | 'ADMIN'>('USER');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('bot_system_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log("📦 CONFIGURAÇÕES CARREGADAS DO STORAGE:", parsed);
        return { ...DEFAULT_SYSTEM_SETTINGS, ...parsed };
      }
    } catch (e) {}
    return DEFAULT_SYSTEM_SETTINGS;
  });

  const handleLoginSuccess = (email: string, isTrial: boolean, days: number, role: 'USER' | 'ADMIN' = 'USER') => {
    setUserEmail(email);
    setIsTrialMode(role !== 'ADMIN' && email.toLowerCase() !== 'gleibeswk@gmail.com');
    setDaysRemaining(role === 'ADMIN' ? 999 : 30);
    setUserRole(role);
    setIsAuthenticated(true);
    setShowAdminPanel(false);
    
    // Recarrega as configurações para garantir que o Admin veja o estado mais recente
    const saved = localStorage.getItem('bot_system_settings');
    if (saved) {
      setSystemSettings({ ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(saved) });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setUserRole('USER');
  };

  const handleSettingsUpdate = useCallback((newSettings: SystemSettings) => {
    localStorage.setItem('bot_system_settings', JSON.stringify(newSettings));
    setSystemSettings({ ...newSettings });
  }, []);

  return {
    isAuthenticated,
    userEmail,
    isTrialMode,
    daysRemaining,
    userRole,
    showAdminPanel,
    setShowAdminPanel,
    systemSettings,
    handleLoginSuccess,
    handleLogout,
    handleSettingsUpdate
  };
};
