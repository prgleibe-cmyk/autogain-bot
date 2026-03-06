import { Broker } from '../types';

const API_BASE = '';

export interface BridgeConnectParams {
  email: string;
  password?: string;
  broker: string;
  type: 'REAL' | 'PRACTICE';
}

export interface BridgeOrderParams {
  asset: string;
  amount: number;
  action: 'call' | 'put';
  type: 'binary' | 'digital';
  account_type: 'REAL' | 'PRACTICE';
}

export const bridgeApi = {
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/ping`);
      const data = await response.json();
      return data.status === 'online';
    } catch (e) {
      return false;
    }
  },

  connect: async (params: BridgeConnectParams) => {
    const response = await fetch(`${API_BASE}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (!response.ok || data.type === 'LOGIN_ERROR' || data.error) {
      throw new Error(data.error || `Erro de conexão: ${response.status}`);
    }
    return data;
  },

  getBalance: async () => {
    try {
      const response = await fetch(`${API_BASE}/balance`);
      if (!response.ok) return null;
      const data = await response.json();
      return typeof data.balance === 'number'
        ? data.balance
        : parseFloat(data.balance);
    } catch (e) {
      return null;
    }
  },

  getMarketDataBulk: async (
    assets: string[],
    period: number = 60,
    count: number = 60
  ) => {
    try {
      const response = await fetch(`${API_BASE}/market_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets, period, count }),
      });
      if (!response.ok) return {};
      const result = await response.json();
      return result.data || {};
    } catch (e) {
      return {};
    }
  },

  placeOrder: async (params: BridgeOrderParams) => {
    const response = await fetch(`${API_BASE}/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        action: params.action.toLowerCase(),
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Ordem rejeitada pela corretora');
    }
    return data;
  },
};
