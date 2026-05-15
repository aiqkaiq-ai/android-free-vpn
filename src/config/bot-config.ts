export interface BotConfig {
  // API Settings
  mudrexApiKey: string;
  mudrexApiSecret: string;

  // Trading Settings
  tradingPairs: string[];
  enableAutoTrading: boolean;

  // Risk Management
  riskPerTrade: number; // Percentage of account
  stopLossPercent: number; // % below entry
  takeProfitPercent: number; // % above entry

  // Monitoring
  checkIntervalMs: number; // How often to check prices
  logInterval: number; // Minutes between stats logs
}

export const defaultConfig: BotConfig = {
  mudrexApiKey: process.env.MUDREX_API_KEY || '',
  mudrexApiSecret: process.env.MUDREX_API_SECRET || '',

  tradingPairs: [
    'BTCUSDT',
    'ETHUSDT',
    'ADAUSDT',
    'XRPUSDT',
  ],
  enableAutoTrading: process.env.ENABLE_AUTO_TRADING === 'true',

  riskPerTrade: 2, // 2% per trade
  stopLossPercent: 2,
  takeProfitPercent: 5,

  checkIntervalMs: 5000, // Check every 5 seconds
  logInterval: 5, // Log stats every 5 minutes
};

export function validateConfig(config: BotConfig): void {
  if (!config.mudrexApiKey) {
    throw new Error('MUDREX_API_KEY is required in .env');
  }
  if (!config.mudrexApiSecret) {
    throw new Error('MUDREX_API_SECRET is required in .env');
  }
  if (config.tradingPairs.length === 0) {
    throw new Error('At least one trading pair is required');
  }
  if (config.riskPerTrade <= 0 || config.riskPerTrade > 10) {
    throw new Error('riskPerTrade must be between 0 and 10');
  }
}
