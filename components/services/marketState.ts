
import { MarketCandle } from '../types';

interface AssetState {
    candles: MarketCandle[];
    currentPrice: number;
    lastUpdated: number;
}

type BatchListener = () => void;

class MarketStateStore {
    private static instance: MarketStateStore;
    private _cache = new Map<string, AssetState>();
    private _listeners = new Set<BatchListener>();
    
    public static getInstance() {
        if (!MarketStateStore.instance) MarketStateStore.instance = new MarketStateStore();
        return MarketStateStore.instance;
    }

    update(asset: string, candles: MarketCandle[]) {
        if (!candles || candles.length === 0) return;

        const currentPrice = candles[candles.length - 1].close;
        this._cache.set(asset, {
            candles,
            currentPrice,
            lastUpdated: Date.now()
        });
    }

    notifyUpdates() {
        this._listeners.forEach(cb => cb());
    }

    subscribe(cb: BatchListener) {
        this._listeners.add(cb);
        return () => this._listeners.delete(cb);
    }

    getAll(): Record<string, AssetState> {
        const now = Date.now();
        const validEntries: Record<string, AssetState> = {};
        const MAX_STALENESS = 15000; // 15s - Reduzido para garantir dados frescos no modo ultra-rápido

        this._cache.forEach((state, key) => {
            if (now - state.lastUpdated <= MAX_STALENESS) {
                validEntries[key] = state;
            } else {
                // Remove dados muito antigos para forçar o HiveMind a esperar novos dados
                this._cache.delete(key);
            }
        });
        return validEntries;
    }

    clear() {
        this._cache.clear();
        this.notifyUpdates();
    }
}

export const MarketState = MarketStateStore.getInstance();
