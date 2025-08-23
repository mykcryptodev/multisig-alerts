// Environment configuration with type safety

export const config = {
  safe: {
    chainId: process.env.SAFE_CHAIN_ID || '8453',
    address: process.env.SAFE_ADDRESS || '',
    apiKey: process.env.SAFE_API_KEY || '',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
  vercel: {
    kvUrl: process.env.KV_URL || '',
    kvRestApiUrl: process.env.KV_REST_API_URL || '',
    kvRestApiToken: process.env.KV_REST_API_TOKEN || '',
    kvRestApiReadOnlyToken: process.env.KV_REST_API_READ_ONLY_TOKEN || '',
  },
  cronSecret: process.env.CRON_SECRET || '',
} as const;

// Chain configuration
export const chainConfig = {
  1: { name: 'ethereum', explorer: 'https://etherscan.io' },
  10: { name: 'optimism', explorer: 'https://optimistic.etherscan.io' },
  137: { name: 'polygon', explorer: 'https://polygonscan.com' },
  8453: { name: 'base', explorer: 'https://basescan.org' },
  42161: { name: 'arbitrum', explorer: 'https://arbiscan.io' },
} as const;

export function getChainConfig(chainId: string | number) {
  const id = Number(chainId);
  return chainConfig[id as keyof typeof chainConfig] || { 
    name: `chain ${id}`, 
    explorer: '' 
  };
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatEthValue(valueWei: string): string {
  if (!valueWei || valueWei === '0') return '0';
  
  try {
    const wei = BigInt(valueWei);
    const eth = Number(wei / BigInt(10 ** 14)) / 10000;
    return eth.toFixed(4).replace(/\.?0+$/, '');
  } catch {
    return '0';
  }
}
