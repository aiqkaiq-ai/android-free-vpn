import { MudrexAPI } from './mudrex-api';
import { SimpleMomentumStrategy, TradingSignal } from '../strategies/simple-momentum';
import { BotConfig } from '../config/bot-config';

interface ActiveTrade {
  symbol: string;
  entryPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  orderId: string;
}

interface BotStats {
  activeTrades: number;
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  lastSignals: TradingSignal[];
}

export class TradingBot {
  private api: MudrexAPI;
  private strategy: SimpleMomentumStrategy;
  private config: BotConfig;
  private activeTrades: Map<string, ActiveTrade> = new Map();
  private tradeHistory: Array<{ symbol: string; profit: number; timestamp: number }> = [];
  private isRunning = false;
  private lastLogTime = 0;

  constructor(config: BotConfig) {
    this.config = config;
    this.api = new MudrexAPI({
      apiKey: config.mudrexApiKey,
      apiSecret: config.mudrexApiSecret,
    });
    this.strategy = new SimpleMomentumStrategy();
  }

  async start(): Promise<void> {
    console.log('\n🚀 Crypto Trading Bot Starting...');
    console.log(`API Key: ${this.config.mudrexApiKey.substring(0, 10)}...`);
    console.log(`Trading Pairs: ${this.config.tradingPairs.join(', ')}`);
    console.log(`Risk per Trade: ${this.config.riskPerTrade}%`);
    console.log(`Auto Trading: ${this.config.enableAutoTrading ? '🟢 ENABLED' : '🔴 DISABLED (TEST MODE)'}`);

    this.isRunning = true;
    console.log('\n🤖 Trading bot started');
    console.log(`📊 Monitoring pairs: ${this.config.tradingPairs.join(', ')}\n`);

    this.runTradingLoop();
  }

  private async runTradingLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.monitorMarket();
        await this.sleep(this.config.checkIntervalMs);
      } catch (error) {
        console.error('Error in trading loop:', error);
      }
    }
  }

  private async monitorMarket(): Promise<void> {
    const signals: TradingSignal[] = [];

    for (const pair of this.config.tradingPairs) {
      try {
        const marketPrice = await this.api.getPrice(pair);
        const signal = this.strategy.analyzePrice(pair, marketPrice.price);
        signals.push(signal);

        // Log signal
        if (signal.signal !== 'hold') {
          console.log(
            `📈 ${pair}: RSI=${signal.rsi.toFixed(2)}, SMA20=${signal.sma20.toFixed(2)}, SMA50=${signal.sma50.toFixed(2)}, Price=${signal.price.toFixed(2)}`
          );
          console.log(
            `🔔 Signal for ${pair}: ${signal.signal.toUpperCase()} (strength: ${signal.strength.toFixed(2)})`
          );

          if (this.config.enableAutoTrading && !this.activeTrades.has(pair)) {
            await this.executeSignal(signal);
          } else if (!this.config.enableAutoTrading) {
            console.log(`⏸️  Auto trading disabled - signal not executed`);
          }
        }

        // Monitor existing trades
        await this.checkActiveTrades(pair, marketPrice.price);
      } catch (error) {
        // Silently continue on API errors
      }
    }

    // Log stats every N minutes
    const now = Date.now();
    if (now - this.lastLogTime > this.config.logInterval * 60 * 1000) {
      this.logStats();
      this.lastLogTime = now;
    }
  }

  private async executeSignal(signal: TradingSignal): Promise<void> {
    try {
      const balances = await this.api.getBalance();
      const usdtBalance = balances.find((b) => b.symbol === 'USDT');

      if (!usdtBalance) {
        console.log(`❌ No USDT balance found for ${signal.symbol}`);
        return;
      }

      const tradeAmount = (usdtBalance.free * this.config.riskPerTrade) / 100;
      const quantity = tradeAmount / signal.price;

      if (signal.signal === 'buy') {
        const order = await this.api.createOrder(signal.symbol, 'buy', quantity);
        console.log(
          `✅ BUY order placed: ${quantity.toFixed(8)} ${signal.symbol} @ ${signal.price.toFixed(2)}`
        );

        this.activeTrades.set(signal.symbol, {
          symbol: signal.symbol,
          entryPrice: signal.price,
          quantity,
          stopLoss: signal.price * (1 - this.config.stopLossPercent / 100),
          takeProfit: signal.price * (1 + this.config.takeProfitPercent / 100),
          orderId: order.id,
        });
      } else if (signal.signal === 'sell') {
        const trade = this.activeTrades.get(signal.symbol);
        if (trade) {
          const order = await this.api.createOrder(signal.symbol, 'sell', trade.quantity);
          console.log(
            `✅ SELL order placed: ${trade.quantity.toFixed(8)} ${signal.symbol} @ ${signal.price.toFixed(2)}`
          );

          const profit = (signal.price - trade.entryPrice) * trade.quantity;
          this.tradeHistory.push({
            symbol: signal.symbol,
            profit,
            timestamp: Date.now(),
          });

          this.activeTrades.delete(signal.symbol);
        }
      }
    } catch (error) {
      console.error(`Error executing signal for ${signal.symbol}:`, error);
    }
  }

  private async checkActiveTrades(symbol: string, currentPrice: number): Promise<void> {
    const trade = this.activeTrades.get(symbol);
    if (!trade) return;

    // Check stop loss
    if (currentPrice <= trade.stopLoss) {
      console.log(
        `⛔ STOP LOSS triggered for ${symbol} @ ${currentPrice.toFixed(2)} (SL: ${trade.stopLoss.toFixed(2)})`
      );
      await this.api.createOrder(symbol, 'sell', trade.quantity);

      const loss = (currentPrice - trade.entryPrice) * trade.quantity;
      this.tradeHistory.push({ symbol, profit: loss, timestamp: Date.now() });
      this.activeTrades.delete(symbol);
    }
    // Check take profit
    else if (currentPrice >= trade.takeProfit) {
      console.log(
        `🎉 TAKE PROFIT hit for ${symbol} @ ${currentPrice.toFixed(2)} (TP: ${trade.takeProfit.toFixed(2)})`
      );
      await this.api.createOrder(symbol, 'sell', trade.quantity);

      const profit = (currentPrice - trade.entryPrice) * trade.quantity;
      this.tradeHistory.push({ symbol, profit, timestamp: Date.now() });
      this.activeTrades.delete(symbol);
    }
  }

  private logStats(): void {
    const stats = this.getStats();
    console.log('\n📊 BOT STATISTICS');
    console.log(`Active Trades: ${stats.activeTrades}`);
    console.log(`Total Trades: ${stats.totalTrades}`);
    console.log(`Total PnL: $${stats.totalPnL.toFixed(2)}`);
    console.log(`Win Rate: ${(stats.winRate * 100).toFixed(1)}%`);
    console.log('---');
  }

  getStats(): BotStats {
    const winningTrades = this.tradeHistory.filter((t) => t.profit > 0).length;
    const totalPnL = this.tradeHistory.reduce((sum, t) => sum + t.profit, 0);

    return {
      activeTrades: this.activeTrades.size,
      totalTrades: this.tradeHistory.length,
      totalPnL,
      winRate: this.tradeHistory.length > 0 ? winningTrades / this.tradeHistory.length : 0,
      lastSignals: [],
    };
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('\n🛑 Trading bot stopped');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
