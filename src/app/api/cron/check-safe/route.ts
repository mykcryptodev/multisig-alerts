// API route for checking Safe transactions
// This will be called by Vercel cron

import { NextRequest, NextResponse } from 'next/server';
import { getSafeApi } from '@/lib/safe-api';
import { config } from '@/config/env';

export const runtime = 'nodejs';
export const maxDuration = 60; // Maximum function duration in seconds

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (in production)
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${config.cronSecret}`) {
        console.error('Unauthorized cron request');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('Starting Safe transaction check...');
    console.log(`Chain ID: ${config.safe.chainId}`);
    console.log(`Safe Address: ${config.safe.address}`);

    // Check for new transactions
    const safeApi = getSafeApi();
    const result = await safeApi.checkForNewTransactions();

    console.log('Check complete:', result);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      chainId: config.safe.chainId,
      safeAddress: config.safe.address,
      ...result,
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Optional: POST endpoint for manual triggering
export async function POST(request: NextRequest) {
  // You can add additional authentication here if needed
  return GET(request);
}
