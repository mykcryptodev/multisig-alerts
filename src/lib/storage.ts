// Storage service for persisting seen transactions
// Using Vercel KV when available, fallback to in-memory for local development

import { SeenTransaction } from '@/types/safe';

class StorageService {
  private kvAvailable: boolean = false;
  private memoryStore: Map<string, SeenTransaction> = new Map();

  constructor() {
    // Check if Vercel KV is configured
    this.kvAvailable = !!(
      process.env.KV_REST_API_URL && 
      process.env.KV_REST_API_TOKEN
    );
  }

  private getKvClient() {
    if (!this.kvAvailable) return null;
    
    // Dynamic import to avoid errors when KV is not configured
    try {
      const { kv } = require('@vercel/kv');
      return kv;
    } catch {
      console.warn('Vercel KV not available, using in-memory storage');
      this.kvAvailable = false;
      return null;
    }
  }

  async getSeenTransaction(safeTxHash: string): Promise<SeenTransaction | null> {
    const kv = this.getKvClient();
    
    if (kv) {
      try {
        const data = await kv.get(`safe:tx:${safeTxHash}`) as SeenTransaction | null;
        return data;
      } catch (error) {
        console.error('Error reading from KV:', error);
      }
    }
    
    return this.memoryStore.get(safeTxHash) || null;
  }

  async setSeenTransaction(transaction: SeenTransaction): Promise<void> {
    const kv = this.getKvClient();
    
    if (kv) {
      try {
        // Store with 30 day TTL (2592000 seconds)
        await kv.set(`safe:tx:${transaction.safeTxHash}`, transaction, {
          ex: 2592000,
        });
        return;
      } catch (error) {
        console.error('Error writing to KV:', error);
      }
    }
    
    this.memoryStore.set(transaction.safeTxHash, transaction);
  }

  async getAllSeenTransactions(): Promise<SeenTransaction[]> {
    const kv = this.getKvClient();
    
    if (kv) {
      try {
        const keys = await kv.keys('safe:tx:*');
        const transactions: SeenTransaction[] = [];
        
        for (const key of keys) {
          const tx = await kv.get(key) as SeenTransaction | null;
          if (tx) transactions.push(tx);
        }
        
        return transactions;
      } catch (error) {
        console.error('Error listing from KV:', error);
      }
    }
    
    return Array.from(this.memoryStore.values());
  }

  async hasSeenTransaction(safeTxHash: string): Promise<boolean> {
    const tx = await this.getSeenTransaction(safeTxHash);
    return tx !== null;
  }

  async updateSeenTransaction(
    safeTxHash: string, 
    updates: Partial<SeenTransaction>
  ): Promise<void> {
    const existing = await this.getSeenTransaction(safeTxHash);
    if (existing) {
      await this.setSeenTransaction({
        ...existing,
        ...updates,
        lastChecked: new Date().toISOString(),
      });
    }
  }
}

// Lazy initialization to avoid errors during build
let _storage: StorageService | null = null;

export function getStorage(): StorageService {
  if (!_storage) {
    _storage = new StorageService();
  }
  return _storage;
}
