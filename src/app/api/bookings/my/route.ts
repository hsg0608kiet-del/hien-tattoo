import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const whereClause = role === 'ADMIN' ? {} : { customerId: userId };

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true }
        },
        artist: {
          select: { id: true, name: true, phone: true }
        },
        portfolioItem: true,
        customRequest: true,
        quote: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('GET My Bookings Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
