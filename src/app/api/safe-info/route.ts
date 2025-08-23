// API route for getting Safe information

import { NextRequest, NextResponse } from 'next/server';
import { getSafeInfo } from '@/lib/safe-api-kit';

export async function GET(request: NextRequest) {
  try {
    const safeInfo = await getSafeInfo();
    
    return NextResponse.json({
      success: true,
      data: safeInfo,
    });
  } catch (error) {
    console.error('Error getting Safe info:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
