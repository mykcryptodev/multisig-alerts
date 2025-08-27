import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/server/actions/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, we'll allow any authenticated user to access admin data
    // In a production environment, you'd want to check for admin role
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all transactions with their related multisig and user data
    const transactions = await prisma.seenTransaction.findMany({
      include: {
        multisig: {
          include: {
            user: {
              select: {
                id: true,
                walletAddress: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        firstSeen: 'desc'
      },
      take: limit,
      skip: offset
    });

    const totalCount = await prisma.seenTransaction.count();

    return NextResponse.json({ 
      transactions,
      totalCount,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    console.error('Error fetching admin transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
