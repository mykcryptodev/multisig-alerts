'use server';

import { thirdwebAuth, getUserFromJWT } from '@/lib/thirdweb-auth';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

// Generate SIWE login payload
export async function generatePayload(params: { address: string; chainId: number }) {
  if (!thirdwebAuth) {
    throw new Error('ThirdwebAuth not initialized - missing THIRDWEB_SECRET_KEY');
  }
  
  try {
    const payload = await thirdwebAuth.generatePayload(params);
    return payload;
  } catch (error) {
    console.error('Error generating payload:', error);
    throw new Error('Failed to generate login payload');
  }
}

// Verify user signature and create/update user
export async function login(params: { payload: string; signature: string }) {
  if (!thirdwebAuth) {
    throw new Error('ThirdwebAuth not initialized - missing THIRDWEB_SECRET_KEY');
  }
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const verifiedPayload = await thirdwebAuth.verifyPayload(params as any);
    
    if (verifiedPayload.valid) {
      const walletAddress = verifiedPayload.payload.address;
      
      // Find or create user
      let user = await prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            walletAddress,
            name: `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          },
        });

        // Create default notification settings
        await prisma.notificationSetting.create({
          data: {
            userId: user.id,
            enabled: true,
          },
        });
      }

      // Generate JWT
      const jwt = await thirdwebAuth.generateJWT({
        payload: verifiedPayload.payload,
      });

      // Set JWT in cookies
      const cookieStore = await cookies();
      cookieStore.set('auth-token', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return { success: true, user };
    } else {
      return { success: false, error: 'Invalid signature' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

// Get current user from JWT
export async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const walletAddress = await getUserFromJWT(token);
    
    if (!walletAddress) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        multisigs: true,
        notifications: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Check if user is logged in
export async function isLoggedIn() {
  const user = await getUser();
  return !!user;
}

// Logout user
export async function logout() {
  try {
    console.log('Logout function called');
    const cookieStore = await cookies();
    
    // Check if cookie exists before clearing
    const existingToken = cookieStore.get('auth-token');
    console.log('Existing auth token:', existingToken ? 'exists' : 'not found');
    
    // Clear the auth token cookie by setting it to expire immediately
    cookieStore.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    
    console.log('Auth token cookie cleared');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Logout failed' };
  }
}


