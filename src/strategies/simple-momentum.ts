interface CandelStick {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingSignal {
  symbol: string;
  signal: 'buy' | 'sell' | 'hold';
  strength: number;
  rsi: number;
  sma20: number;
  sma50: number;
  price: number;
}

export class SimpleMomentumStrategy {
  private priceHistory: Map<string, number[]> = new Map();

  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }

  calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  analyzePrice(symbol: string, price: number): TradingSignal {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }

    const history = this.priceHistory.get(symbol)!;
    history.push(price);

    // Keep only last 100 prices
    if (history.length > 100) {
      history.shift();
    }

    const rsi = this.calculateRSI(history, 14);
    const sma20 = this.calculateSMA(history, 20);
    const sma50 = this.calculateSMA(history, 50);

    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0;

    // Buy signal: RSI oversold + price above SMA20
    if (rsi < 30 && price > sma20) {
      signal = 'buy';
      strength = (30 - rsi) / 30; // Strength based on how oversold
    }
    // Sell signal: RSI overbought + price below SMA20
    else if (rsi > 70 && price < sma20) {
      signal = 'sell';
      strength = (rsi - 70) / 30; // Strength based on how overbought
    }
    // Additional confirmation: SMA20 above SMA50 (uptrend)
    else if (sma20 > sma50 && rsi > 50 && rsi < 70) {
      signal = 'buy';
      strength = 0.5;
    }

    return {
      symbol,
      signal,
      strength: Math.min(strength, 1),
      rsi,
      sma20,
      sma50,
      price,
    };
  }
}
