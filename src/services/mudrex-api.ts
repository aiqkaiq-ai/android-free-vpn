import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface MudrexApiConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  status: 'pending' | 'filled' | 'canceled';
  createdAt: number;
}

interface Balance {
  symbol: string;
  free: number;
  locked: number;
  total: number;
}

interface MarketPrice {
  symbol: string;
  price: number;
  timestamp: number;
}

export class MudrexAPI {
  private client: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(config: MudrexApiConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl || 'https://api.mudrex.com/v1';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });
  }

  private generateSignature(params: Record<string, any>): string {
    const query = new URLSearchParams(params).toString();
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(query)
      .digest('hex');
  }

  private async request(method: string, endpoint: string, params?: Record<string, any>) {
    try {
      const timestamp = Date.now();
      const requestParams = {
        ...params,
        timestamp,
        apiKey: this.apiKey,
      };

      const signature = this.generateSignature(requestParams);
      requestParams.signature = signature;

      const response = await this.client({
        method,
        url: endpoint,
        params: method === 'GET' ? requestParams : undefined,
        data: method !== 'GET' ? requestParams : undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Mudrex API Error: ${error.message}`);
    }
  }

  async getBalance(symbol?: string): Promise<Balance[]> {
    const params = symbol ? { symbol } : {};
    const response = await this.request('GET', '/account/balance', params);
    return response.data;
  }

  async getPrice(symbol: string): Promise<MarketPrice> {
    const response = await this.request('GET', '/ticker/price', { symbol });
    return {
      symbol,
      price: parseFloat(response.price),
      timestamp: Date.now(),
    };
  }

  async createOrder(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    price?: number
  ): Promise<Order> {
    const params = {
      symbol,
      side,
      quantity,
      type: price ? 'LIMIT' : 'MARKET',
      ...(price && { price }),
    };

    const response = await this.request('POST', '/order/create', params);
    return {
      id: response.orderId,
      symbol,
      side,
      quantity,
      price: price || 0,
      status: 'pending',
      createdAt: Date.now(),
    };
  }

  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    try {
      await this.request('POST', '/order/cancel', { orderId, symbol });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getOrderStatus(orderId: string, symbol: string): Promise<Order | null> {
    try {
      const response = await this.request('GET', '/order/status', { orderId, symbol });
      return {
        id: response.orderId,
        symbol,
        side: response.side,
        quantity: response.quantity,
        price: response.price,
        status: response.status,
        createdAt: response.createdAt,
      };
    } catch (error) {
      return null;
    }
  }

  async getOpenOrders(symbol?: string): Promise<Order[]> {
    const params = symbol ? { symbol } : {};
    const response = await this.request('GET', '/order/openOrders', params);
    return response.data || [];
  }

  async getOrderHistory(symbol?: string, limit: number = 100): Promise<Order[]> {
    const params = { limit, ...(symbol && { symbol }) };
    const response = await this.request('GET', '/order/history', params);
    return response.data || [];
  }
}
