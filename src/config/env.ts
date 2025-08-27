// Environment configuration with type safety
// Using Thirdweb SDK utilities for blockchain operations

import { toTokens, shortenAddress, toUnits } from 'thirdweb/utils';
import { defineChain } from 'thirdweb/chains';

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
  upstash: {
    redisUrl: process.env.UPSTASH_REDIS_REST_URL || '',
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  },
  thirdweb: {
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
    secretKey: process.env.THIRDWEB_SECRET_KEY || '',
  },
  zapper: {
    apiKey: process.env.ZAPPER_API_KEY || '',
  },
  cronSecret: process.env.CRON_SECRET || '',
} as const;

// Chain configuration using Thirdweb's defineChain
export const chainConfig = {
  1: defineChain({
    id: 1,
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorers: [{ name: 'Etherscan', url: 'https://etherscan.io' }],
  }),
  10: defineChain({
    id: 10,
    name: 'Optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorers: [{ name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' }],
  }),
  137: defineChain({
    id: 137,
    name: 'Polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorers: [{ name: 'PolygonScan', url: 'https://polygonscan.com' }],
  }),
  8453: defineChain({
    id: 8453,
    name: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorers: [{ name: 'BaseScan', url: 'https://basescan.org' }],
  }),
  42161: defineChain({
    id: 42161,
    name: 'Arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorers: [{ name: 'Arbiscan', url: 'https://arbiscan.io' }],
  }),
} as const;

export function getChainConfig(chainId: string | number) {
  const id = Number(chainId);
  const chain = chainConfig[id as keyof typeof chainConfig];
  
  if (chain) {
    return {
      name: chain.name?.toLowerCase() || `chain ${id}`,
      explorer: chain.blockExplorers?.[0]?.url || '',
      chain: chain,
    };
  }
  
  return { 
    name: `chain ${id}`, 
    explorer: '',
    chain: null,
  };
}

// Use Thirdweb's shortenAddress utility instead of manual formatting
export function formatAddress(address: string): string {
  if (!address) return '';
  
  // Check if it's a valid Ethereum address format (0x + 40 hex characters)
  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
  
  if (!isValidAddress) {
    // Fallback for invalid addresses - manual formatting
    if (address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  }
  
  try {
    return shortenAddress(address);
  } catch (error) {
    // Fallback if Thirdweb's shortenAddress fails
    console.warn('Failed to format address with Thirdweb:', address, error);
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

// Use Thirdweb's toTokens utility for proper Wei to ETH conversion
export function formatEthValue(valueWei: string, decimals: number = 18): string {
  if (!valueWei || valueWei === '0') return '0';
  
  try {
    const wei = BigInt(valueWei);
    return toTokens(wei, decimals);
  } catch {
    return '0';
  }
}

// Additional utility using Thirdweb's toWei for reverse conversion
export function formatWeiValue(valueEth: string, decimals: number = 18): string {
  if (!valueEth || valueEth === '0') return '0';
  
  try {
    return toUnits(valueEth, decimals).toString();
  } catch {
    return '0';
  }
}
