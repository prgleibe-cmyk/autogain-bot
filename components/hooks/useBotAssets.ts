
import { useState, useEffect, useMemo } from 'react';
import { SystemSettings } from '../types';
import { GLOBAL_ASSETS_DATABASE } from '../constants';

export const useBotAssets = (isBrokerConnected: boolean, settings: SystemSettings) => {
  const [brokerAssets, setBrokerAssets] = useState<string[]>([]);

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setBrokerAssets(e.detail);
      }
    };
    window.addEventListener('broker_assets_sync', handleSync);
    
    if (isBrokerConnected) {
      const fetchAssets = async () => {
        try {
          const res = await fetch('/assets');
          const data = await res.json();
          // Aceita tanto o array direto quanto o objeto com a propriedade assets
          const assetsList = Array.isArray(data) ? data : (data.assets || []);
          if (assetsList.length > 0) {
            setBrokerAssets(assetsList);
          }
        } catch (e) {
          console.error("[BotAssets] Falha ao sincronizar ativos.");
        }
      };
      fetchAssets();
      const interval = setInterval(fetchAssets, 30000);
      return () => {
        clearInterval(interval);
        window.removeEventListener('broker_assets_sync', handleSync);
      };
    }
    return () => window.removeEventListener('broker_assets_sync', handleSync);
  }, [isBrokerConnected]);

  const assets = useMemo(() => {
    // Usa a lista do broker se disponível, senão a lista global
    const sourceList = brokerAssets.length > 0 ? brokerAssets : GLOBAL_ASSETS_DATABASE;
    
    // Normalização agressiva para bater com o mapeamento do bridge
    const normalized = sourceList.map(asset => {
        if (typeof asset !== 'string') return '';
        // Remove tudo que não for alfanumérico e deixa em maiúsculo
        return asset.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }).filter(Boolean);

    const uniqueAssets = Array.from(new Set(normalized));
    const mode = settings?.tradingMarketMode || 'BOTH';

    return uniqueAssets.filter((asset: string) => {
        const isOTC = asset.includes('OTC');
        if (mode === 'OTC') return isOTC;
        if (mode === 'OPEN') return !isOTC;
        return true;
    });
  }, [isBrokerConnected, brokerAssets, settings?.tradingMarketMode]);

  return { 
    activeAssets: assets, 
    availableAssets: assets, 
    isSyncing: false,
    source: brokerAssets.length > 0 ? 'REAL' : 'SEED'
  };
};
