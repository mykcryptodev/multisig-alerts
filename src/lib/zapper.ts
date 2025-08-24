// Zapper API utilities for account identity resolution

import { config } from '@/config/env';

export interface ZapperAccountInfo {
  name: string;
  source: string;
}

export interface ZapperAccountData {
  displayName?: {
    source: string;
    value: string;
  };
  description?: {
    source: string;
    value: string;
  };
  ensRecord?: {
    name: string;
  };
  basename?: string;
  farcasterProfile?: {
    username: string;
    fid: number;
  };
  lensProfile?: {
    handle: string;
  };
}

/**
 * Fetch account information from Zapper API for multiple addresses
 * @param addresses Array of Ethereum addresses to lookup
 * @returns Record mapping addresses to their identity information
 */
export async function getZapperAccountInfo(
  addresses: string[]
): Promise<Record<string, ZapperAccountInfo | null>> {
  if (!config.zapper.apiKey) {
    console.warn('Zapper API key not configured');
    return {};
  }

  if (addresses.length === 0) {
    return {};
  }

  try {
    const query = `
      query AccountIdentity($addresses: [Address!]!) {
        accounts(addresses: $addresses) {
          displayName {
            source
            value
          }
          description {
            source
            value
          }
          ensRecord {
            name
          }
          basename
          farcasterProfile {
            username
            fid
          }
          lensProfile {
            handle
          }
        }
      }
    `;

    const response = await fetch('https://public.zapper.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': config.zapper.apiKey,
      },
      body: JSON.stringify({
        query,
        variables: { addresses },
      }),
    });

    if (!response.ok) {
      console.warn('Zapper API request failed:', response.status);
      return {};
    }

    const data = await response.json();
    
    if (data.errors) {
      console.warn('Zapper API errors:', data.errors);
      return {};
    }

    const result: Record<string, ZapperAccountInfo | null> = {};
    
    addresses.forEach((address, index) => {
      const account = data.data?.accounts?.[index] as ZapperAccountData | undefined;
      if (account) {
        // Priority: displayName > farcasterProfile > lensProfile > ensRecord > basename
        if (account.displayName?.value) {
          result[address] = {
            name: account.displayName.value,
            source: account.displayName.source.toLowerCase(),
          };
        } else if (account.farcasterProfile?.username) {
          result[address] = {
            name: `@${account.farcasterProfile.username}`,
            source: 'farcaster',
          };
        } else if (account.lensProfile?.handle) {
          result[address] = {
            name: account.lensProfile.handle,
            source: 'lens',
          };
        } else if (account.ensRecord?.name) {
          result[address] = {
            name: account.ensRecord.name,
            source: 'ens',
          };
        } else if (account.basename) {
          result[address] = {
            name: account.basename,
            source: 'basename',
          };
        } else {
          result[address] = null;
        }
      } else {
        result[address] = null;
      }
    });

    return result;
  } catch (error) {
    console.warn('Failed to fetch Zapper account info:', error);
    return {};
  }
}

/**
 * Get account information for a single address
 * @param address Ethereum address to lookup
 * @returns Account information or null if not found
 */
export async function getZapperAccountInfoSingle(
  address: string
): Promise<ZapperAccountInfo | null> {
  const result = await getZapperAccountInfo([address]);
  return result[address] || null;
}
