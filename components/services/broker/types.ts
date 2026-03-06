
import { OptionType, TradeResult } from '../../types';

export interface BrokerDriver {
    connect(credentials: any): Promise<any>;
    getBalance(): Promise<number>;
    getAssets(type: 'binary' | 'digital'): Promise<string[]>;
    placeOrder(params: {
        asset: string;
        amount: number;
        direction: 'call' | 'put';
        type: OptionType;
    }): Promise<string>;
    checkResult(orderId: string): Promise<{
        status: 'pending' | 'closed';
        win: boolean;
        profit: number;
    }>;
}
