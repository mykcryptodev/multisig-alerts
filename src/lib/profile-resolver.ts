// Profile resolution utilities for addresses

import { getSocialProfiles } from 'thirdweb/social';
import { getContract, readContract } from 'thirdweb';
import { formatAddress, chainConfig } from '@/config/env';
import { getZapperAccountInfo, ZapperAccountInfo } from './zapper';

export interface ProfileInfo {
  address: string;
  name: string;
  avatar?: string;
  type?: string;
  hasSigned: boolean;
}

export interface AddressProfile {
  name: string;
  avatar?: string;
  source: string;
}

/**
 * Resolve profiles for multiple addresses using Thirdweb social profiles and Zapper fallback
 * @param addresses Array of addresses to resolve
 * @param confirmedSigners Array of addresses that have signed
 * @param client Thirdweb client
 * @returns Array of resolved profiles
 */
export async function resolveMultipleProfiles(
  addresses: string[],
  confirmedSigners: string[],
  client: any
): Promise<ProfileInfo[]> {
  if (!client || addresses.length === 0) {
    return addresses.map(address => ({
      address,
      name: formatAddress(address),
      hasSigned: confirmedSigners.includes(address.toLowerCase()) || confirmedSigners.includes(address),
    }));
  }

  // Step 1: Try Thirdweb for all addresses
  const profiles = await Promise.all(
    addresses.map(async (address) => {
      try {
        const socialProfiles = await getSocialProfiles({
          address,
          client,
        });
        
        // Find the best profile (prioritize Farcaster, then Lens, then ENS)
        const farcasterProfile = socialProfiles.find(p => p.type === 'farcaster');
        const lensProfile = socialProfiles.find(p => p.type === 'lens');
        const ensProfile = socialProfiles.find(p => p.type === 'ens');
        
        const bestProfile = farcasterProfile || lensProfile || ensProfile;
        
        return {
          address,
          name: bestProfile?.name || formatAddress(address),
          avatar: bestProfile?.avatar,
          type: bestProfile?.type,
          hasSigned: confirmedSigners.includes(address.toLowerCase()) || confirmedSigners.includes(address),
          needsZapper: !bestProfile?.name,
        };
      } catch (error) {
        console.warn(`Failed to fetch social profile for ${address}:`, error);
        return {
          address,
          name: formatAddress(address),
          avatar: undefined,
          type: undefined,
          hasSigned: confirmedSigners.includes(address.toLowerCase()) || confirmedSigners.includes(address),
          needsZapper: true,
        };
      }
    })
  );

  // Step 2: Batch Zapper lookup for addresses that need it
  const addressesNeedingZapper = profiles
    .filter((p: any) => p.needsZapper)
    .map((p: any) => p.address);

  if (addressesNeedingZapper.length > 0) {
    try {
      console.log(`Making Zapper API call for ${addressesNeedingZapper.length} addresses:`, addressesNeedingZapper);
      const zapperProfiles = await getZapperAccountInfo(addressesNeedingZapper);
      
      // Update profiles with Zapper data (only for genuine human-readable names)
      profiles.forEach((profile: any) => {
        if (profile.needsZapper && zapperProfiles[profile.address]?.name && zapperProfiles[profile.address]?.source !== 'address') {
          const zapperProfile = zapperProfiles[profile.address]!;
          console.log(`Found Zapper name for ${profile.address}: ${zapperProfile.name} (${zapperProfile.source})`);
          profile.name = zapperProfile.name;
          profile.type = zapperProfile.source;
        }
      });
    } catch (error) {
      console.warn('Failed to fetch Zapper profiles:', error);
    }
  }

  // Step 3: Clean up temporary needsZapper property
  return profiles.map((profile: any) => {
    const { needsZapper, ...cleanProfile } = profile;
    return cleanProfile;
  });
}

/**
 * Resolve a single address name using multiple sources
 * @param address Address to resolve
 * @param client Thirdweb client
 * @param chainId Chain ID for contract lookups
 * @returns Resolved profile information
 */
export async function resolveSingleAddress(
  address: string,
  client: any,
  chainId?: string | number
): Promise<AddressProfile> {
  let name = formatAddress(address);
  let avatar: string | undefined;
  let source = 'address';

  if (!client) {
    return { name, source };
  }

  // 1. Try Thirdweb social profiles first
  try {
    const profiles = await getSocialProfiles({
      address,
      client,
    });
    
    const farcasterProfile = profiles.find(p => p.type === 'farcaster');
    const lensProfile = profiles.find(p => p.type === 'lens');
    const ensProfile = profiles.find(p => p.type === 'ens');
    
    const bestProfile = farcasterProfile || lensProfile || ensProfile;
    if (bestProfile?.name) {
      return {
        name: bestProfile.name,
        avatar: bestProfile.avatar,
        source: bestProfile.type || 'social',
      };
    }
  } catch (error) {
    console.warn(`Failed to fetch social profile for ${address}:`, error);
  }

  // 2. Try ERC-20 token lookup if chain is provided
  if (chainId && name === formatAddress(address)) {
    try {
      const chainIdNum = Number(chainId);
      const chain = chainConfig[chainIdNum as keyof typeof chainConfig];
      
      if (chain) {
        const contract = getContract({
          client,
          chain,
          address,
        });
        
        // Try to get token name and symbol (assume it might be an ERC20)
        const [tokenNameResult, tokenSymbolResult] = await Promise.allSettled([
          readContract({
            contract,
            method: 'function name() view returns (string)',
            params: [],
          }),
          readContract({
            contract,
            method: 'function symbol() view returns (string)',
            params: [],
          }),
        ]);
        
        if (tokenNameResult.status === 'fulfilled' && tokenNameResult.value) {
          const symbol = tokenSymbolResult.status === 'fulfilled' && tokenSymbolResult.value 
            ? ` (${tokenSymbolResult.value})` 
            : '';
          name = `${tokenNameResult.value}${symbol}`;
          source = 'token';
          console.log(`Found token name for address: ${name}`);
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch token info for address ${address}:`, error);
    }
  }

  // 3. If still no name, try Zapper as final fallback
  if (name === formatAddress(address)) {
    try {
      const zapperInfo = await getZapperAccountInfo([address]);
      const zapperProfile = zapperInfo[address];
      if (zapperProfile?.name && zapperProfile.source !== 'address') {
        console.log(`Found Zapper name for address: ${zapperProfile.name} (${zapperProfile.source})`);
        return {
          name: zapperProfile.name,
          source: zapperProfile.source,
        };
      }
    } catch (error) {
      console.warn(`Failed to fetch Zapper profile for address:`, error);
    }
  }

  return { name, avatar, source };
}
