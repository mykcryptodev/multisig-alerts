// API endpoints for managing multisigs
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

// GET /api/multisigs - List user's multisigs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const multisigs = await prisma.multisig.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(multisigs);
  } catch (error) {
    console.error('Error fetching multisigs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch multisigs' },
      { status: 500 }
    );
  }
}

// POST /api/multisigs - Create a new multisig
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { chainId, address, name } = await request.json();

    // Validate required fields
    if (!chainId || !address) {
      return NextResponse.json(
        { error: 'Chain ID and address are required' },
        { status: 400 }
      );
    }

    // Validate address format (basic check)
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Check if multisig already exists for this user
    const existing = await prisma.multisig.findUnique({
      where: {
        userId_chainId_address: {
          userId: session.user.id,
          chainId: parseInt(chainId),
          address: address.toLowerCase(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Multisig already exists' },
        { status: 400 }
      );
    }

    // Create multisig
    const multisig = await prisma.multisig.create({
      data: {
        userId: session.user.id,
        chainId: parseInt(chainId),
        address: address.toLowerCase(),
        name,
        enabled: true,
      },
    });

    return NextResponse.json(multisig);
  } catch (error) {
    console.error('Error creating multisig:', error);
    return NextResponse.json(
      { error: 'Failed to create multisig' },
      { status: 500 }
    );
  }
}