// Storage service for persisting seen transactions
// Using Vercel Edge Config Store (replaces Vercel KV as of June 2025)

import { get } from '@vercel/edge-config';
import { SeenTransaction } from '@/types/safe';

class StorageService {
  private edgeConfigAvailable: boolean = false;

  constructor() {
    // Check if Vercel Edge Config is configured
    this.edgeConfigAvailable = !!process.env.EDGE_CONFIG;
  }

  private getEdgeConfig() {
    if (!this.edgeConfigAvailable) {
      console.warn('Vercel Edge Config not available, using in-memory storage');
      return null;
    }
    
    return { get, set: this.setInMemory, delete: this.deleteInMemory };
  }

  // In-memory fallback storage
  private memoryStore: Map<string, SeenTransaction> = new Map();

  async getSeenTransaction(safeTxHash: string): Promise<SeenTransaction | null> {
    const edgeConfig = this.getEdgeConfig();
    
    if (edgeConfig) {
      try {
        const data = await edgeConfig.get(`safe:tx:${safeTxHash}`) as SeenTransaction | null;
        return data;
      } catch (error) {
        console.error('Error reading from Edge Config:', error);
      }
    }
    
    return this.memoryStore.get(safeTxHash) || null;
  }

  async setSeenTransaction(transaction: SeenTransaction): Promise<void> {
    const edgeConfig = this.getEdgeConfig();
    
    if (edgeConfig) {
      try {
        // Edge Config doesn't support dynamic keys, so we'll use a different approach
        // We'll store all transactions under a single key and manage them in memory
        await this.updateTransactionsInEdgeConfig(transaction);
        return;
      } catch (error) {
        console.error('Error writing to Edge Config:', error);
      }
    }
    
    this.memoryStore.set(transaction.safeTxHash, transaction);
  }

  private async updateTransactionsInEdgeConfig(transaction: SeenTransaction): Promise<void> {
    try {
      // Get existing transactions
      const existing = await get('safe_transactions') as Record<string, SeenTransaction> || {};
      
      // Add new transaction
      existing[transaction.safeTxHash] = transaction;
      
      // Note: Edge Config is read-only in production, so we'll use in-memory for writes
      // In a real implementation, you'd use Edge Config for reads and a different service for writes
      this.memoryStore.set(transaction.safeTxHash, transaction);
      
    } catch (error) {
      console.error('Error updating Edge Config:', error);
      // Fallback to in-memory
      this.memoryStore.set(transaction.safeTxHash, transaction);
    }
  }

  async getAllSeenTransactions(): Promise<SeenTransaction[]> {
    const edgeConfig = this.getEdgeConfig();
    
    if (edgeConfig) {
      try {
        const transactions = await get('safe_transactions') as Record<string, SeenTransaction> || {};
        return Object.values(transactions);
      } catch (error) {
        console.error('Error listing from Edge Config:', error);
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
      const updated = {
        ...existing,
        ...updates,
        lastChecked: new Date().toISOString(),
      };
      
      if (this.edgeConfigAvailable) {
        await this.updateTransactionsInEdgeConfig(updated);
      } else {
        this.memoryStore.set(safeTxHash, updated);
      }
    }
  }

  // Helper methods for in-memory operations
  private setInMemory(key: string, value: any): Promise<void> {
    this.memoryStore.set(key, value);
    return Promise.resolve();
  }

  private deleteInMemory(key: string): Promise<void> {
    this.memoryStore.delete(key);
    return Promise.resolve();
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
