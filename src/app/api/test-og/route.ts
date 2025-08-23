import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test parameters for OG image generation using real addresses
    const testParams = new URLSearchParams({
      safeTxHash: '0x94f814db70e0c388b400dc7d0e3e9c341ac32fb75b8693b70c102af3da918953',
      safeAddress: '0x10f76316eB9f132a72E62481018F00cfEe326E15', // Real Safe address
      chainId: '8453',
      to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      value: '0', // No ETH for token transaction
      nonce: '42',
      confirmations: '1',
      threshold: '2',
      owners: '0xe82338C94223b3DC15F26e4E289DE19aa56156dF,0xBBed00dCc38fB66778267F81050b1AA544B1f2f3,0x5ceAc6B3d26E0957C8A809E31d596C16e5780d96,0xd013D4724432DeE11fa20dE39B8b50Fdec64fe90,0x06b0A2C6beeA3fd215D47324DD49E1ee3a4a9F25', // Real owners
      confirmedSigners: '0x06b0A2C6beeA3fd215D47324DD49E1ee3a4a9F25', // One confirmed signer
      method: 'approve',
      data: '0x095ea7b3000000000000000000000000111111125421ca6dc452d289314280a0f8842a6500000000000000000000000000000000000000000000000000000000001e8480', // Real approve data
    });

    const ogImageUrl = `/api/og/transaction?${testParams.toString()}`;
    
    return NextResponse.json({
      success: true,
      message: 'OG Image test endpoint',
      ogImageUrl,
      testParams: Object.fromEntries(testParams.entries()),
      instructions: [
        'Visit the ogImageUrl to see the generated image',
        'This tests the OG image generation with sample data',
        'Check the browser console for any errors',
        'The image should show transaction details and owner profiles',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate test parameters',
      },
      { status: 500 }
    );
  }
}
