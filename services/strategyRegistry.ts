import { MarketSnapshot, Signal, StrategyDefinition } from '../types';

// Import Strategies Manually to avoid 'import.meta.glob' runtime errors
import emaCrossover from './strategies/emaCrossoverStrategy';
import falseBreakout from './strategies/falseBreakoutStrategy';
import fibonacci from './strategies/fibonacciStrategy';
import impulsePullback from './strategies/impulsePullbackStrategy';
import momentumVolume from './strategies/momentumVolumeStrategy';
import otcStrategies from './strategies/otcStrategies';
import patternVolume from './strategies/patternVolumeStrategy';
import quickRetraction from './strategies/quickRetractionStrategy';
import rsiDivergence from './strategies/rsiDivergenceStrategy';
import rsiReversal from './strategies/rsiReversalStrategy';
import trendFollowing from './strategies/trendFollowingStrategy';
import testHighFreq from './strategies/testHighFreqStrategy';

export interface StrategyModule {
    id: string;
    name: string;
    description: string;
    marketType: 'OPEN' | 'OTC' | 'BOTH';
    timeframe: 'M1' | 'M5';
    bypassGlobalFilters?: boolean;
    analyze: (snapshot: MarketSnapshot) => Signal[];
}

export const STRATEGY_REGISTRY: Record<string, StrategyModule> = {};
export const STRATEGIES_REPOSITORY: StrategyDefinition[] = [];

// Weights for Score Calculation
export const STRATEGY_WEIGHTS: Record<string, number> = {
    'FIBONACCI_RETRACTION_M1': 1.15,
    'RSI_DIVERGENCE_M1': 1.15,
    'FALSE_BREAKOUT_M1': 1.12,
    'PATTERN_VOLUME_M1': 1.10,
    'EMA_CROSSOVER_M1': 1.10,
    'IMPULSE_PULLBACK_M1': 1.08,
    'MOMENTUM_VOLUME': 1.08,
    'QUICK_RETRACTION': 1.00,
    'RSI_REVERSAL': 1.00,
    'OTC_STRATEGIES': 1.05,
    'TEST_HIGH_FREQ': 1.00
};

// List of all strategy modules
const strategies: any[] = [
    emaCrossover,
    falseBreakout,
    fibonacci,
    impulsePullback,
    momentumVolume,
    otcStrategies,
    patternVolume,
    quickRetraction,
    rsiDivergence,
    rsiReversal,
    trendFollowing,
    testHighFreq
];

// Initialize Registry
strategies.forEach((strategy) => {
    if (strategy && strategy.id && strategy.analyze) {
        STRATEGY_REGISTRY[strategy.id] = strategy;
        
        // Populate Repository for UI
        STRATEGIES_REPOSITORY.push({
            id: strategy.id,
            name: strategy.name,
            description: strategy.description,
            marketType: strategy.marketType,
            timeframe: strategy.timeframe,
            bypassGlobalFilters: strategy.bypassGlobalFilters
        });
    }
});

// Always include the Test Strategy
if (!STRATEGY_REGISTRY['TEST_HIGH_FREQ']) {
    STRATEGIES_REPOSITORY.unshift({
        id: 'TEST_HIGH_FREQ',
        name: '⚡ MODO TESTE (Ignorar)',
        description: 'DO NOT USE FOR REAL TRADING. Testing strategy only.',
        marketType: 'BOTH',
        timeframe: 'M1',
        bypassGlobalFilters: true
    });
}
