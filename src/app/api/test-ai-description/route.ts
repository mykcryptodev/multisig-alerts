import { NextRequest, NextResponse } from 'next/server';
import { generateTransactionDescription } from '@/lib/ai-description';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get test parameters
    const data = searchParams.get('data') || '0xa9059cbb000000000000000000000000742c15c0b9a6d9c2a4a5f0e6a3f8b7e9f5d4c3b2000000000000000000000000000000000000000000000000000de0b6b3a7640000';
    const to = searchParams.get('to') || '0xA0b86a33E6417c7d0d7e3F8d7E6B2F5C4D3B2A1';
    const value = searchParams.get('value') || '0';
    const chainId = searchParams.get('chainId') || '8453';
    const method = searchParams.get('method') || 'transfer';

    console.log('Testing AI description with:', { data, to, value, chainId, method });

    const aiDescription = await generateTransactionDescription({
      data,
      to,
      value,
      chainId,
      method
    });

    return NextResponse.json({
      success: true,
      description: aiDescription,
      input: { data, to, value, chainId, method }
    });
  } catch (error) {
    console.error('Test AI description error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'edge';
