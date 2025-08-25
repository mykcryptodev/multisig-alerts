// API route for getting Safe information

import { NextRequest, NextResponse } from 'next/server';
import { getSafeInfo } from '@/lib/safe-api-kit';
import { checksumAddress } from 'thirdweb/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chainId = searchParams.get('chainId');
    
    if (!address || !chainId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: address and chainId',
        },
        { status: 400 }
      );
    }
    
    // Convert address to checksummed format to avoid validation errors
    const checksummedAddress = checksumAddress(address);
    
    console.log('🔍 safe-info API called with:', { 
      originalAddress: address, 
      checksummedAddress, 
      chainId: Number(chainId) 
    });
    
    const safeInfo = await getSafeInfo(checksummedAddress, Number(chainId));
    
    console.log('🔍 safe-info API received response:', { 
      requestedAddress: checksummedAddress, 
      responseAddress: safeInfo.address,
      addressMatch: safeInfo.address.toLowerCase() === checksummedAddress.toLowerCase()
    });
    
    return NextResponse.json({
      success: true,
      data: safeInfo,
    });
  } catch (error) {
    console.error('❌ Error getting Safe info:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
