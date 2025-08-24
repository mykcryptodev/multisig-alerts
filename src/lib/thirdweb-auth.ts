import { createThirdwebClient } from "thirdweb";
import { createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";

// Create thirdweb client with both clientId and secretKey support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clientConfig: any = {};

if (process.env.THIRDWEB_SECRET_KEY) {
  clientConfig.secretKey = process.env.THIRDWEB_SECRET_KEY;
}

if (process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || process.env.THIRDWEB_CLIENT_ID) {
  clientConfig.clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || process.env.THIRDWEB_CLIENT_ID;
}

// Provide a fallback for development
if (!clientConfig.secretKey && !clientConfig.clientId) {
  console.warn('No thirdweb credentials found. Using development fallback.');
  clientConfig.clientId = 'development-client-id';
}

export const client = createThirdwebClient(clientConfig);

// Create auth instance (only for server-side usage)
export const thirdwebAuth = process.env.THIRDWEB_SECRET_KEY ? createAuth({
  domain: process.env.NEXTAUTH_URL || "localhost:3000",
  client,
  // Use a backend wallet to sign login payloads
  adminAccount: privateKeyToAccount({ 
    client, 
    privateKey: process.env.THIRDWEB_ADMIN_PRIVATE_KEY! 
  }),
}) : null;

// Helper function to get user from JWT
export async function getUserFromJWT(jwt: string) {
  if (!thirdwebAuth) {
    throw new Error('ThirdwebAuth not initialized - missing THIRDWEB_SECRET_KEY');
  }
  
  try {
    const result = await thirdwebAuth.verifyJWT({ jwt });
    if (result.valid && 'parsedJWT' in result) {
      return result.parsedJWT.sub; // sub is the user's wallet address
    }
    return null;
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return null;
  }
}
