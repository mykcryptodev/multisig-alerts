import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { getSocialProfiles } from 'thirdweb/social';
import { createThirdwebClient } from 'thirdweb';
import { config, formatAddress, formatEthValue, getChainConfig } from '@/config/env';

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
    
    // Fetch social profiles for owners (limit to first 3 for space)
    let ownerProfiles: Array<{
      address: string;
      name: string;
      avatar?: string;
      type?: string;
      hasSigned: boolean;
    }> = [];

    // Fetch human-readable name for the "To" address
    let toAddressName = formatAddress(to || 'Unknown');
    if (to && config.thirdweb.clientId) {
      try {
        const client = createThirdwebClient({
          clientId: config.thirdweb.clientId,
        });
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
        }
      } catch (error) {
        console.warn(`Failed to fetch social profile for "To" address ${to}:`, error);
        // Keep the default formatted address
      }
    }

    // Only try to fetch social profiles if Thirdweb client ID is configured
    if (config.thirdweb.clientId) {
      try {
        const client = createThirdwebClient({
          clientId: config.thirdweb.clientId,
        });

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
              };
            } catch (error) {
              console.warn(`Failed to fetch social profile for ${owner}:`, error);
              return {
                address: owner,
                name: formatAddress(owner),
                avatar: undefined,
                type: undefined,
                hasSigned: confirmedSigners.includes(owner.toLowerCase()) || confirmedSigners.includes(owner),
              };
            }
          })
        );
      } catch (error) {
        console.warn('Failed to initialize Thirdweb client for social profiles:', error);
        // Fallback to basic address formatting
        ownerProfiles = owners.map(owner => ({
          address: owner,
          name: formatAddress(owner),
          avatar: undefined,
          type: undefined,
          hasSigned: confirmedSigners.includes(owner.toLowerCase()) || confirmedSigners.includes(owner),
        }));
      }
    } else {
      // No Thirdweb client ID configured, use basic address formatting
      ownerProfiles = owners.map(owner => ({
        address: owner,
        name: formatAddress(owner),
        avatar: undefined,
        type: undefined,
        hasSigned: confirmedSigners.includes(owner.toLowerCase()) || confirmedSigners.includes(owner),
      }));
    }

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
              color: 'transparent',
              WebkitBackgroundClip: 'text',
            }}
          >
            🔔 Safe Transaction Alert
          </div>

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