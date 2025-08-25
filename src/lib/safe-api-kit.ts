// Simple Safe API service using the official Safe API Kit SDK directly

import SafeApiKit from '@safe-global/api-kit';

// Lazy initialization to avoid build-time errors
let safeApi: SafeApiKit | null = null;

function getSafeApi(): SafeApiKit {
  if (!safeApi) {
    // SafeApiKit requires an API key for production use
    // You can get one at https://developer.safe.global
    const configOptions: { chainId: bigint; apiKey?: string } = {
      chainId: BigInt(8453), // Default to Base, but this function is not used for multi-tenant
    };
    
    if (process.env.SAFE_API_KEY) {
      configOptions.apiKey = process.env.SAFE_API_KEY;
    }
    
    safeApi = new SafeApiKit(configOptions);
  }
  return safeApi;
}

export async function getSafeInfo(address: string, chainId: number) {
  if (!address) {
    throw new Error('Address parameter is required');
  }
  
  console.log('🔍 getSafeInfo called with:', { address, chainId });
  
  // Create a new SafeApiKit instance for the specific chain
  const configOptions: { chainId: bigint; apiKey?: string } = {
    chainId: BigInt(chainId),
  };
  
  if (process.env.SAFE_API_KEY) {
    configOptions.apiKey = process.env.SAFE_API_KEY;
  }
  
  const safeApi = new SafeApiKit(configOptions);
  console.log('🔍 SafeApiKit instance created for chainId:', chainId);
  
  const result = await safeApi.getSafeInfo(address);
  console.log('🔍 SafeApiKit.getSafeInfo returned:', { 
    requestedAddress: address, 
    returnedAddress: result.address,
    addressMatch: result.address.toLowerCase() === address.toLowerCase()
  });
  
  return result;
}

// Export the getter function for direct use if needed
export { getSafeApi };
