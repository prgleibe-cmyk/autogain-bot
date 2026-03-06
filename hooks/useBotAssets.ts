
import { useState, useEffect, useMemo } from 'react';
import { SystemSettings } from '../types';
import { GLOBAL_ASSETS_DATABASE } from '../constants';

export const useBotAssets = (isBrokerConnected: boolean, settings: SystemSettings) => {
  const [brokerAssets, setBrokerAssets] = useState<string[]>([]);

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        console.log("[BotAssets] Recebido broker_assets_sync:", e.detail.length, "ativos");
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
    const internalList = GLOBAL_ASSETS_DATABASE;
    
    console.log("[BotAssets] brokerAssets atuais:", brokerAssets.length, brokerAssets.slice(0, 5));

    const normalizedBrokerAssets = new Set(brokerAssets.map(a => 
        typeof a === 'string' ? a.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : ''
    ).filter(Boolean));

    // Filtra a lista interna: apenas o que o bot conhece E que está disponível no broker
    let sourceList = internalList.filter(asset => {
        const normalizedInternal = asset.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        // Se o broker ainda não enviou ativos, assume que todos da lista interna são válidos (SEED mode)
        if (brokerAssets.length === 0) return true;
        return normalizedBrokerAssets.has(normalizedInternal);
    });

    // Fallback: Se o filtro resultou em nada mas temos uma lista interna, usa a interna
    if (sourceList.length === 0 && internalList.length > 0) {
        console.warn("[BotAssets] Filtro resultou em 0 ativos. Usando lista interna completa como fallback.");
        sourceList = internalList;
    }
    
    const normalized = sourceList.map(asset => {
        if (typeof asset !== 'string') return '';
        return asset.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }).filter(Boolean);

    const uniqueAssets = Array.from(new Set(normalized));
    const mode = settings?.tradingMarketMode || 'BOTH';

    const finalAssets = uniqueAssets.filter((asset: string) => {
        const isOTC = asset.includes('OTC');
        if (mode === 'OTC') return isOTC;
        if (mode === 'OPEN') return !isOTC;
        return true;
    });

    console.log(`[BotAssets] Ativos Finais: ${finalAssets.length}`, finalAssets);
    return finalAssets;
  }, [isBrokerConnected, brokerAssets, settings?.tradingMarketMode]);

  return { 
    activeAssets: assets, 
    availableAssets: assets, 
    isSyncing: false,
    source: brokerAssets.length > 0 ? 'REAL' : 'SEED'
  };
};
