import React, { useEffect, useState, useMemo } from 'react';
import { ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Bar, Cell, ReferenceDot } from 'recharts';
import { MarketCandle, Trade } from '../types';

interface TradingChartProps {
  data: MarketCandle[];
  currentPrice: number;
  trades: Trade[];
  assetName: string;
}

const TradingChart: React.FC<TradingChartProps> = ({ data, currentPrice, trades, assetName }) => {
  // Flash Effect State
  const [priceColor, setPriceColor] = useState<string>('text-emerald-400');
  const [prevPrice, setPrevPrice] = useState<number>(currentPrice);

  useEffect(() => {
    if (currentPrice > prevPrice) {
      setPriceColor('text-emerald-400 brightness-150');
    } else if (currentPrice < prevPrice) {
      setPriceColor('text-rose-400 brightness-150');
    }
    setPrevPrice(currentPrice);

    const timeout = setTimeout(() => {
       // Safe check for data existence
       const lastOpen = data.length > 0 ? data[data.length-1].open : currentPrice;
       setPriceColor(currentPrice >= lastOpen ? 'text-emerald-400' : 'text-rose-400');
    }, 300);

    return () => clearTimeout(timeout);
  }, [currentPrice, data]); // Added data dependency safely


  // 1. Process Data for Candlesticks - MEMOIZED AGGRESSIVELY
  const processedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    // Limit to last 60 candles for performance
    const displayData = data.length > 60 ? data.slice(-60) : data;

    return displayData
      .filter(d => d && typeof d.close === 'number' && typeof d.time === 'number')
      .map(d => ({
        ...d,
        wick: [d.low, d.high],
        body: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
        color: d.close >= d.open ? '#10b981' : '#f43f5e',
        timeStr: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }));
  }, [data]); // Only recalculate if market data array reference changes

  // 2. Filter Trades - MEMOIZED
  const visibleTrades = useMemo(() => {
    if (processedData.length === 0) return [];
    const minTime = processedData[0].time;
    const maxTime = processedData[processedData.length - 1].time;
    // Add buffer
    return trades.filter(t => t.timestamp >= minTime && t.timestamp <= maxTime + 30000); // 30s buffer ahead
  }, [trades, processedData]);

  // Loading State
  if (processedData.length < 2) {
    return (
      <div className="h-full w-full bg-slate-900 rounded-lg border border-slate-700 p-4 shadow-inner flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
           <div className="relative">
             <div className="w-10 h-10 border-4 border-slate-700 rounded-full"></div>
             <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
           </div>
           <span className="text-slate-400 text-xs font-mono animate-pulse">Carregando Velas...</span>
        </div>
      </div>
    );
  }

  // Calculate domain once per render cycle
  const minPrice = Math.min(...processedData.map(d => d.low)) * 0.99995;
  const maxPrice = Math.max(...processedData.map(d => d.high)) * 1.00005;
  const lastCandle = processedData[processedData.length - 1];
  const isUp = lastCandle.close >= lastCandle.open;

  return (
    <div className="h-full w-full bg-slate-900 rounded-lg border border-slate-700 p-4 shadow-inner relative overflow-hidden group">
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-3 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-lg">
        <span className="text-slate-400 text-xs font-bold font-mono tracking-wider">{assetName}</span>
        <span className={`text-xl font-bold font-mono transition-all duration-300 ${priceColor}`}>
          {currentPrice.toFixed(5)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={processedData}>
          <XAxis 
            dataKey="time" 
            type="number" 
            domain={['auto', 'auto']}
            stroke="#475569" 
            tick={{fontSize: 10, fill: '#64748b'}} 
            tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
            dy={10}
            padding={{left: 10, right: 10}}
          />
          <YAxis 
            domain={[minPrice, maxPrice]} 
            stroke="#475569" 
            orientation="right" 
            tick={{fontSize: 10, fill: '#64748b'}}
            width={60}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => val.toFixed(5)}
          />
          
          <Tooltip 
             trigger="hover"
             contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}
             labelFormatter={(label) => new Date(label).toLocaleTimeString()}
             formatter={(value: any, name: string) => {
                if (Array.isArray(value)) return [value[1]?.toFixed(5), name === 'wick' ? 'High' : 'Close'];
                return [Number(value).toFixed(5), name];
             }}
             cursor={{ stroke: '#475569', strokeDasharray: '4 4' }}
          />

          <ReferenceLine y={currentPrice} stroke={isUp ? "#10b981" : "#f43f5e"} strokeDasharray="3 3" />

          <Bar dataKey="wick" barSize={1} isAnimationActive={false}>
            {processedData.map((entry, index) => (
              <Cell key={`wick-${index}`} fill={entry.color} />
            ))}
          </Bar>

          <Bar dataKey="body" barSize={8} isAnimationActive={false}>
            {processedData.map((entry, index) => (
              <Cell key={`body-${index}`} fill={entry.color} />
            ))}
          </Bar>

          {visibleTrades.map((trade) => (
             <React.Fragment key={trade.id}>
               <ReferenceLine 
                  y={trade.entryPrice} 
                  stroke={trade.direction === 'CALL' ? '#10b981' : '#f43f5e'} 
                  strokeDasharray="2 2"
                  strokeOpacity={0.7}
                  label={{ 
                    position: 'right', 
                    value: trade.direction, 
                    fill: trade.direction === 'CALL' ? '#10b981' : '#f43f5e',
                    fontSize: 9
                  }}
               />
               <ReferenceDot 
                  x={trade.timestamp}
                  y={trade.entryPrice}
                  r={4}
                  fill={trade.direction === 'CALL' ? '#10b981' : '#f43f5e'}
                  stroke="#fff"
                  strokeWidth={1}
                  isFront={true}
               />
             </React.Fragment>
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Export Memoized Component to prevent re-renders on parent updates if props didn't change
export default React.memo(TradingChart);