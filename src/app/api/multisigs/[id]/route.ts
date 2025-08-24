// API endpoints for managing individual multisigs
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromJWT } from '@/lib/thirdweb-auth';

// Update multisig
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const updates = await request.json();

    // Verify ownership
    const multisig = await prisma.multisig.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!multisig) {
      return NextResponse.json({ error: 'Multisig not found' }, { status: 404 });
    }

    // Update multisig
    const updatedMultisig = await prisma.multisig.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({
      message: 'Multisig updated successfully',
      multisig: updatedMultisig,
    });
  } catch (error) {
    console.error('Error updating multisig:', error);
    return NextResponse.json(
      { error: 'Failed to update multisig' },
      { status: 500 }
    );
  }
}

// Delete multisig
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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

    const { id } = await params;

    // Verify ownership
    const multisig = await prisma.multisig.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!multisig) {
      return NextResponse.json({ error: 'Multisig not found' }, { status: 404 });
    }

    // Delete multisig
    await prisma.multisig.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Multisig deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting multisig:', error);
    return NextResponse.json(
      { error: 'Failed to delete multisig' },
      { status: 500 }
    );
  }
}
