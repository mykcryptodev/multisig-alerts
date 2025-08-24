// API endpoints for managing individual multisigs
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

// PATCH /api/multisigs/[id] - Update a multisig
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, enabled } = await request.json();

    // Verify ownership
    const multisig = await prisma.multisig.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!multisig) {
      return NextResponse.json(
        { error: 'Multisig not found' },
        { status: 404 }
      );
    }

    // Update multisig
    const updated = await prisma.multisig.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating multisig:', error);
    return NextResponse.json(
      { error: 'Failed to update multisig' },
      { status: 500 }
    );
  }
}

// DELETE /api/multisigs/[id] - Delete a multisig
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership
    const multisig = await prisma.multisig.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!multisig) {
      return NextResponse.json(
        { error: 'Multisig not found' },
        { status: 404 }
      );
    }

    // Delete multisig (cascade will delete related transactions)
    await prisma.multisig.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Multisig deleted successfully' });
  } catch (error) {
    console.error('Error deleting multisig:', error);
    return NextResponse.json(
      { error: 'Failed to delete multisig' },
      { status: 500 }
    );
  }
}