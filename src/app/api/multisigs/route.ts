// API endpoints for managing multisigs
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromJWT } from '@/lib/thirdweb-auth';

// Get user's multisigs
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const walletAddress = await getUserFromJWT(authToken);
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const multisigs = await prisma.multisig.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ multisigs });
  } catch (error) {
    console.error('Error fetching multisigs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch multisigs' },
      { status: 500 }
    );
  }
}

// Create new multisig
export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const walletAddress = await getUserFromJWT(authToken);
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { chainId, address, name } = await request.json();

    // Validate required fields
    if (!chainId || !address) {
      return NextResponse.json(
        { error: 'Chain ID and address are required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Check if multisig already exists for this user
    const existingMultisig = await prisma.multisig.findFirst({
      where: {
        userId: user.id,
        chainId: parseInt(chainId),
        address: address.toLowerCase(),
      },
    });

    if (existingMultisig) {
      return NextResponse.json(
        { error: 'Multisig already exists for this user' },
        { status: 400 }
      );
    }

    // Create multisig
    const multisig = await prisma.multisig.create({
      data: {
        userId: user.id,
        chainId: parseInt(chainId),
        address: address.toLowerCase(),
        name: name || null,
      },
    });

    return NextResponse.json({
      message: 'Multisig created successfully',
      multisig,
    });
  } catch (error) {
    console.error('Error creating multisig:', error);
    return NextResponse.json(
      { error: 'Failed to create multisig' },
      { status: 500 }
    );
  }
}
