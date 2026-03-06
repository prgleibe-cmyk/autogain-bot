
import { StrategyPerformance } from '../types';

export const statsManager = {
  updateStrategyStats: (stratId: string, isWin: boolean, profit: number) => {
    try {
      const currentSettings = JSON.parse(localStorage.getItem('bot_system_settings') || '{}');
      
      if (!currentSettings.strategyStats) currentSettings.strategyStats = {};
      if (!currentSettings.strategyStats[stratId]) {
          currentSettings.strategyStats[stratId] = { wins: 0, losses: 0, profit: 0 };
      }
      
      const stats = currentSettings.strategyStats[stratId];
      
      if (isWin) stats.wins += 1;
      else stats.losses += 1;
      
      stats.profit += profit;
      
      localStorage.setItem('bot_system_settings', JSON.stringify(currentSettings));
    } catch (e) {
      console.error("Erro ao salvar estatísticas da estratégia", e);
    }
  }
};
