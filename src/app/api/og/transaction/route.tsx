import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { getSocialProfiles } from 'thirdweb/social';
import { createThirdwebClient } from 'thirdweb';
import { getContract } from 'thirdweb';
import { readContract } from 'thirdweb';
import { toTokens } from 'thirdweb/utils';
import { config, formatAddress, formatEthValue, getChainConfig, chainConfig } from '@/config/env';

// Zapper API helper function
async function getZapperAccountInfo(addresses: string[]): Promise<Record<string, { name: string; source: string } | null>> {
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

    const result: Record<string, { name: string; source: string } | null> = {};
    
    addresses.forEach((address, index) => {
      const account = data.data?.accounts?.[index];
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

// Function to decode ERC-20 approve transactions
async function decodeERC20Approve(data: string, to: string, client: any, chain: any): Promise<{
  isApprove: boolean;
  tokenName?: string;
  tokenSymbol?: string;
  spenderName?: string;
  spenderAddress?: string;
  amount?: string;
  formattedAmount?: string;
} | null> {
  try {
    // Check if this is an ERC-20 approve call (function signature: 0x095ea7b3)
    if (!data.startsWith('0x095ea7b3')) {
      return { isApprove: false };
    }

    // Decode the approve function parameters
    // approve(address spender, uint256 amount)
    // data format: 0x095ea7b3 + 32 bytes spender + 32 bytes amount
    if (data.length < 138) { // 10 chars for 0x095ea7b3 + 128 chars for params
      return { isApprove: false };
    }

    const spenderAddress = '0x' + data.slice(34, 74); // Extract spender address
    const amountHex = data.slice(74, 138); // Extract amount
    const amountBigInt = BigInt('0x' + amountHex);

    // Get token info
    const tokenContract = getContract({
      client,
      chain,
      address: to,
    });

    const [tokenNameResult, tokenSymbolResult, tokenDecimalsResult] = await Promise.allSettled([
      readContract({
        contract: tokenContract,
        method: 'function name() view returns (string)',
        params: [],
      }),
      readContract({
        contract: tokenContract,
        method: 'function symbol() view returns (string)',
        params: [],
      }),
      readContract({
        contract: tokenContract,
        method: 'function decimals() view returns (uint8)',
        params: [],
      }),
    ]);

    const tokenName = tokenNameResult.status === 'fulfilled' ? tokenNameResult.value : 'Unknown Token';
    const tokenSymbol = tokenSymbolResult.status === 'fulfilled' ? tokenSymbolResult.value : 'UNKNOWN';
    const decimals = tokenDecimalsResult.status === 'fulfilled' ? Number(tokenDecimalsResult.value) : 18;

    // Format amount
    let formattedAmount = 'Unknown';
    try {
      if (amountBigInt === BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')) {
        formattedAmount = 'Unlimited';
      } else {
        formattedAmount = toTokens(amountBigInt, decimals);
      }
    } catch (error) {
      console.warn('Failed to format token amount:', error);
    }

    // Try to get spender name using the same comprehensive logic as "To" address
    let spenderName = formatAddress(spenderAddress);
    
    // 1. Try Thirdweb social profiles first
    try {
      const spenderProfiles = await getSocialProfiles({
        address: spenderAddress,
        client,
      });
      
      const farcasterProfile = spenderProfiles.find(p => p.type === 'farcaster');
      const lensProfile = spenderProfiles.find(p => p.type === 'lens');
      const ensProfile = spenderProfiles.find(p => p.type === 'ens');
      
      const bestSpenderProfile = farcasterProfile || lensProfile || ensProfile;
      if (bestSpenderProfile?.name) {
        spenderName = bestSpenderProfile.name;
      }
    } catch (error) {
      console.warn('Failed to fetch spender social profile:', error);
    }

    // 2. If no social profile, try to get spender contract name
    if (spenderName === formatAddress(spenderAddress)) {
      try {
        const spenderContract = getContract({
          client,
          chain,
          address: spenderAddress,
        });
        
        const spenderNameResult = await readContract({
          contract: spenderContract,
          method: 'function name() view returns (string)',
          params: [],
        });
        
        if (spenderNameResult) {
          spenderName = spenderNameResult;
        }
      } catch (error) {
        // Ignore - not all contracts have a name function
      }
    }

    // 3. If still no name, try Zapper as final fallback
    if (spenderName === formatAddress(spenderAddress)) {
      try {
        const zapperInfo = await getZapperAccountInfo([spenderAddress]);
        const zapperProfile = zapperInfo[spenderAddress];
        if (zapperProfile?.name && zapperProfile.source !== 'address') {
          spenderName = zapperProfile.name;
          console.log(`Found Zapper name for spender: ${zapperProfile.name} (${zapperProfile.source})`);
        }
      } catch (error) {
        console.warn('Failed to fetch Zapper profile for spender:', error);
      }
    }

    return {
      isApprove: true,
      tokenName,
      tokenSymbol,
      spenderName,
      spenderAddress,
      amount: amountBigInt.toString(),
      formattedAmount,
    };

  } catch (error) {
    console.warn('Failed to decode ERC-20 approve:', error);
    return { isApprove: false };
  }
}

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse transaction data from query parameters
    const safeTxHash = searchParams.get('safeTxHash');
    const safeAddress = searchParams.get('safeAddress');
    const chainId = searchParams.get('chainId') || '8453';
    const to = searchParams.get('to');
    const value = searchParams.get('value') || '0';
    const nonce = searchParams.get('nonce');
    const confirmations = searchParams.get('confirmations') || '0';
    const threshold = searchParams.get('threshold') || '1';
    const owners = searchParams.get('owners')?.split(',') || [];
    const confirmedSigners = searchParams.get('confirmedSigners')?.split(',') || [];
    const method = searchParams.get('method');
    const data = searchParams.get('data'); // Transaction data for decoding

    if (!safeTxHash || !safeAddress) {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f172a',
              color: 'white',
              fontSize: 24,
            }}
          >
            Missing required parameters
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Get chain configuration
    const chain = getChainConfig(chainId);
    const valueEth = formatEthValue(value);
    
    // Try to decode ERC-20 approve transaction
    let approveDetails: any = null;
    if (config.thirdweb.clientId && data && to) {
      try {
        const client = createThirdwebClient({
          clientId: config.thirdweb.clientId,
        });
        
        const chainIdNum = Number(chainId);
        const chainObj = chainConfig[chainIdNum as keyof typeof chainConfig];
        
        if (chainObj) {
          approveDetails = await decodeERC20Approve(data, to, client, chainObj);
        }
      } catch (error) {
        console.warn('Failed to decode approve transaction:', error);
      }
    }
    
    // Fetch social profiles for owners (limit to first 3 for space)
    let ownerProfiles: Array<{
      address: string;
      name: string;
      avatar?: string;
      type?: string;
      hasSigned: boolean;
      needsZapper?: boolean;
    }> = [];

    // Step 1: Collect all addresses that might need Zapper lookup
    const allAddresses = [...(to ? [to] : []), ...owners].filter(Boolean);
    let zapperProfiles: Record<string, { name: string; source: string } | null> = {};
    
    // Step 2: Try Thirdweb first for all addresses, then ERC-20 token lookup, track which need Zapper fallback
    let toAddressName = formatAddress(to || 'Unknown');
    let toNeedsZapper = true;
    
    if (config.thirdweb.clientId) {
      try {
        const client = createThirdwebClient({
          clientId: config.thirdweb.clientId,
        });

        // Try Thirdweb for "To" address
        if (to) {
          try {
            const toProfiles = await getSocialProfiles({
              address: to,
              client,
            });
            
            // Find the best profile (prioritize Farcaster, then Lens, then ENS)
            const farcasterProfile = toProfiles.find(p => p.type === 'farcaster');
            const lensProfile = toProfiles.find(p => p.type === 'lens');
            const ensProfile = toProfiles.find(p => p.type === 'ens');
            
            const bestToProfile = farcasterProfile || lensProfile || ensProfile;
            if (bestToProfile?.name) {
              toAddressName = bestToProfile.name;
              toNeedsZapper = false;
            }
          } catch (error) {
            console.warn(`Failed to fetch Thirdweb social profile for "To" address ${to}:`, error);
          }
          
          // If no social profile found, try ERC-20 token lookup before Zapper
          if (toNeedsZapper && toAddressName === formatAddress(to)) {
            try {
              const chainIdNum = Number(chainId);
              const chain = chainConfig[chainIdNum as keyof typeof chainConfig];
              
              if (chain) {
                const contract = getContract({
                  client,
                  chain,
                  address: to,
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
                  toAddressName = `${tokenNameResult.value}${symbol}`;
                  toNeedsZapper = false; // Found token name, no need for Zapper
                  console.log(`Found token name for "To" address: ${toAddressName}`);
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch token info for "To" address ${to}:`, error);
            }
          }
        }

        // Try Thirdweb for owners
        ownerProfiles = await Promise.all(
          owners.map(async (owner) => {
            try {
              const profiles = await getSocialProfiles({
                address: owner,
                client,
              });
              
              // Find the best profile (prioritize Farcaster, then Lens, then ENS)
              const farcasterProfile = profiles.find(p => p.type === 'farcaster');
              const lensProfile = profiles.find(p => p.type === 'lens');
              const ensProfile = profiles.find(p => p.type === 'ens');
              
              const bestProfile = farcasterProfile || lensProfile || ensProfile;
              
              return {
                address: owner,
                name: bestProfile?.name || formatAddress(owner),
                avatar: bestProfile?.avatar,
                type: bestProfile?.type,
                hasSigned: confirmedSigners.includes(owner.toLowerCase()) || confirmedSigners.includes(owner),
                needsZapper: !bestProfile?.name,
              };
            } catch (error) {
              console.warn(`Failed to fetch social profile for ${owner}:`, error);
              return {
                address: owner,
                name: formatAddress(owner),
                avatar: undefined,
                type: undefined,
                hasSigned: confirmedSigners.includes(owner.toLowerCase()) || confirmedSigners.includes(owner),
                needsZapper: true,
              };
            }
          })
        );
        
      } catch (error) {
        console.warn('Failed to initialize Thirdweb client for social profiles:', error);
        // Mark all as needing Zapper
        ownerProfiles = owners.map(owner => ({
          address: owner,
          name: formatAddress(owner),
          avatar: undefined,
          type: undefined,
          hasSigned: confirmedSigners.includes(owner.toLowerCase()) || confirmedSigners.includes(owner),
          needsZapper: true,
        }));
      }
    } else {
      // No Thirdweb client ID configured, mark all as needing Zapper
      ownerProfiles = owners.map(owner => ({
        address: owner,
        name: formatAddress(owner),
        avatar: undefined,
        type: undefined,
        hasSigned: confirmedSigners.includes(owner.toLowerCase()) || confirmedSigners.includes(owner),
        needsZapper: true,
      }));
    }

    // Step 3: Single Zapper API call for all addresses that need it
    const addressesNeedingZapper = [
      ...(toNeedsZapper && to ? [to] : []),
      ...ownerProfiles.filter(p => p.needsZapper).map(p => p.address),
    ];

    if (addressesNeedingZapper.length > 0) {
      try {
        console.log(`Making single Zapper API call for ${addressesNeedingZapper.length} addresses:`, addressesNeedingZapper);
        zapperProfiles = await getZapperAccountInfo(addressesNeedingZapper);
        
        // Update "To" address name if needed (only for genuine human-readable names)
        if (toNeedsZapper && to && zapperProfiles[to]?.name && zapperProfiles[to]?.source !== 'address') {
          toAddressName = zapperProfiles[to].name;
          console.log(`Found Zapper name for "To" address: ${zapperProfiles[to].name} (${zapperProfiles[to].source})`);
        }
        
        // Update owner profiles with Zapper data (only for genuine human-readable names)
        ownerProfiles = ownerProfiles.map(profile => {
          if (profile.needsZapper && zapperProfiles[profile.address]?.name && zapperProfiles[profile.address]?.source !== 'address') {
            const zapperProfile = zapperProfiles[profile.address]!;
            console.log(`Found Zapper name for owner ${profile.address}: ${zapperProfile.name} (${zapperProfile.source})`);
            return {
              ...profile,
              name: zapperProfile.name,
              type: zapperProfile.source,
            };
          }
          return profile;
        });
        
      } catch (error) {
        console.warn('Failed to fetch Zapper profiles:', error);
      }
    }

    // Step 4: Clean up temporary needsZapper property
    ownerProfiles = ownerProfiles.map((profile) => {
      const { needsZapper, ...cleanProfile } = profile as any;
      return cleanProfile;
    });

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: 'white',
            padding: '40px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '30px',
              fontSize: '42px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
            }}
          >
            {approveDetails?.isApprove ? '🔐 New Token Approval' : '🔔 New Safe Transaction'}
          </div>

          {/* ERC-20 Approve Details (if applicable) */}
          {approveDetails?.isApprove && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                width: '100%',
                maxWidth: '900px',
                backgroundColor: '#1e293b',
                padding: '25px',
                borderRadius: '16px',
                border: '2px solid #f59e0b',
                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#f59e0b',
                  alignItems: 'center',
                  gap: '10px',
                  justifyContent: 'center',
                }}
              >
                🔐 Approval Details
              </div>
              
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '18px',
                }}
              >
                <div style={{ display: 'flex', color: '#94a3b8' }}>Token:</div>
                <div
                  style={{
                    display: 'flex',
                    fontWeight: 'bold',
                    color: '#10b981',
                  }}
                >
                  {approveDetails.tokenName} ({approveDetails.tokenSymbol})
                </div>
              </div>
              
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '18px',
                }}
              >
                <div style={{ display: 'flex', color: '#94a3b8' }}>Amount:</div>
                <div
                  style={{
                    display: 'flex',
                    fontWeight: 'bold',
                    color: approveDetails.formattedAmount === 'Unlimited' ? '#ef4444' : '#f59e0b',
                  }}
                >
                  {approveDetails.formattedAmount} {approveDetails.tokenSymbol}
                </div>
              </div>
              
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '18px',
                }}
              >
                <div style={{ display: 'flex', color: '#94a3b8' }}>Spender:</div>
                <div
                  style={{
                    display: 'flex',
                    fontWeight: 'bold',
                    color: '#8b5cf6',
                    fontFamily: approveDetails.spenderName === formatAddress(approveDetails.spenderAddress) ? 'monospace' : 'inherit',
                  }}
                >
                  {approveDetails.spenderName}
                </div>
              </div>
            </div>
          )}

          {/* Main Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '30px',
              width: '100%',
              maxWidth: '900px',
              alignItems: 'center',
            }}
          >
            {/* Transaction Info Card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                width: '100%',
                backgroundColor: '#1e293b',
                padding: '30px',
                borderRadius: '16px',
                border: '2px solid #334155',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Safe Address Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#94a3b8',
                  }}
                >
                  🏦 Safe Address:
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#60a5fa',
                  }}
                >
                  {formatAddress(safeAddress)}
                </div>
              </div>

              {/* To Address Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#94a3b8',
                  }}
                >
                  📤 To Address:
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontFamily: toAddressName === formatAddress(to || 'Unknown') ? 'monospace' : 'inherit',
                    fontWeight: 'bold',
                    color: '#10b981',
                  }}
                >
                  {toAddressName}
                </div>
              </div>

              {/* Value Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#94a3b8',
                  }}
                >
                  💰 Value:
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontWeight: 'bold',
                    color: '#f59e0b',
                  }}
                >
                  {valueEth} ETH
                </div>
              </div>

              {/* Signatures Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#94a3b8',
                  }}
                >
                  ✍️ Signatures:
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontWeight: 'bold',
                    color: '#ef4444',
                    fontSize: '24px',
                  }}
                >
                  {confirmations}/{threshold}
                </div>
              </div>

              {/* Method Row (conditional) */}
              {method && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#94a3b8',
                    }}
                  >
                    ⚡ Method:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      color: '#8b5cf6',
                    }}
                  >
                    {method}
                  </div>
                </div>
              )}

              {/* Nonce Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#94a3b8',
                  }}
                >
                  🔢 Nonce:
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontWeight: 'bold',
                    color: '#06b6d4',
                  }}
                >
                  {nonce || 'Unknown'}
                </div>
              </div>
            </div>

            {/* Signers Section */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#94a3b8',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                👥 Signers
              </div>
              
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {ownerProfiles.map((profile, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '20px',
                      backgroundColor: profile.hasSigned ? '#0f3f26' : '#1e293b',
                      borderRadius: '12px',
                      border: profile.hasSigned ? '2px solid #10b981' : '2px solid #334155',
                      minWidth: '120px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      position: 'relative',
                    }}
                  >
                    {/* Avatar */}
                    {profile.avatar ? (
                      <div
                        style={{
                          display: 'flex',
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          border: '3px solid #3b82f6',
                          overflow: 'hidden',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          border: '3px solid #1d4ed8',
                        }}
                      >
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Signed Checkmark */}
                    {profile.hasSigned && (
                      <div
                        style={{
                          display: 'flex',
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: 'white',
                        }}
                      >
                        ✅
                      </div>
                    )}
                    
                    {/* Name */}
                    <div
                      style={{
                        display: 'flex',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        maxWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#e2e8f0',
                      }}
                    >
                      {profile.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '16px',
              color: '#64748b',
            }}
          >
            <div style={{ display: 'flex' }}>
              Chain: {chain.name}
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: 'monospace',
                fontSize: '14px',
              }}
            >
              TX: {safeTxHash.slice(0, 10)}...{safeTxHash.slice(-8)}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#dc2626',
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          Error generating image
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}