import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Update booking status to CONFIRMED (whether it was PENDING_DEPOSIT, PENDING_APPROVAL, or APPROVED)
    const updatedBooking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: 'CONFIRMED'
      }
    });

    return NextResponse.json({ booking: updatedBooking });
  } catch (error: any) {
    console.error('Payment Mock Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
