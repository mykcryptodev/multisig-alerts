// API route for checking Safe transactions
// This will be called by Vercel cron

import { NextRequest, NextResponse } from 'next/server';
import { checkAllMultisigs } from '@/lib/multisig-monitor';
import { config } from '@/config/env';

export const runtime = 'nodejs';
export const maxDuration = 60; // Maximum function duration in seconds

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (in production)
    // Only check authorization for GET requests with the cron header
    if (process.env.NODE_ENV === 'production') {
      const cronHeader = request.headers.get('x-vercel-cron');
      const authHeader = request.headers.get('authorization');
      
      // If this is a cron request (has x-vercel-cron header), verify auth
      if (cronHeader && authHeader !== `Bearer ${config.cronSecret}`) {
        console.error('Unauthorized cron request');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('Starting multi-tenant Safe transaction check...');

    // Check all registered multisigs
    const result = await checkAllMultisigs();

    console.log('Check complete:', result);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
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

// POST endpoint for manual triggering from dashboard
export async function POST() {
  try {
    // For POST requests (manual triggers), we don't require cron authentication
    // since these come from the dashboard UI
    console.log('Starting manual multi-tenant Safe transaction check...');

    // Check all registered multisigs
    const result = await checkAllMultisigs();

    console.log('Manual check complete:', result);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error('Error in manual check:', error);
    
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
