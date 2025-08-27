import { NextResponse } from 'next/server';
import { getUser } from '@/server/actions/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, we'll allow any authenticated user to access admin data
    // In a production environment, you'd want to check for admin role
    
    // Get all users with their related data
    const users = await prisma.user.findMany({
      include: {
        multisigs: {
          include: {
            transactions: true
          }
        },
        notifications: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
