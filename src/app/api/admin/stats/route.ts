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

    // For now, we'll allow any authenticated user to access admin stats
    // In a production environment, you'd want to check for admin role
    
    // Get comprehensive stats
    const [
      totalUsers,
      totalMultisigs,
      activeMultisigs,
      totalTransactions,
      usersWithNotifications,
      recentTransactions
    ] = await Promise.all([
      prisma.user.count(),
      prisma.multisig.count(),
      prisma.multisig.count({ where: { enabled: true } }),
      prisma.seenTransaction.count(),
      prisma.notificationSetting.count({ where: { enabled: true } }),
      prisma.seenTransaction.count({
        where: {
          firstSeen: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    const stats = {
      totalUsers,
      totalMultisigs,
      activeMultisigs,
      totalTransactions,
      usersWithNotifications,
      recentTransactions,
      systemHealth: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
      }
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
