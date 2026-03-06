
import { useState, useEffect } from 'react';
import { MarketDataMap } from '../types';
import { MarketState } from '../services/marketState';

export const useMarketData = () => {
  const [multiAssetData, setMultiAssetData] = useState<MarketDataMap>({});
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  
  // Atualização UI-Friendly (menos frequente que o bot)
  useEffect(() => {
      const interval = setInterval(() => {
          const snapshot = MarketState.getAll();
          
          const formatted: MarketDataMap = {};
          let firstAssetPrice = 0;

          Object.keys(snapshot).forEach((asset, idx) => {
              formatted[asset] = snapshot[asset].candles;
              if (idx === 0) firstAssetPrice = snapshot[asset].currentPrice;
          });

          setMultiAssetData(formatted);
          if (firstAssetPrice > 0) setCurrentPrice(firstAssetPrice);

      }, 1000); // 1 FPS para UI (leve)

      return () => clearInterval(interval);
  }, []);

  // CORREÇÃO: Busca por 'EURUSD' (sem barra) ou o primeiro ativo disponível no snapshot
  // O valor anterior 'EUR/USD' falhava pois o backend/database usa o padrão 'EURUSD'
  const assetKeys = Object.keys(multiAssetData);
  const defaultAsset = assetKeys.includes('EURUSD') ? 'EURUSD' : assetKeys[0];

  return { 
      marketData: defaultAsset ? multiAssetData[defaultAsset] : [], 
      allMarketData: multiAssetData, 
      currentPrice 
  };
};
