import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      artistId,
      serviceType, // 'CONSULTATION' | 'DESIGN' | 'TATTOO'
      totalPrice,
      depositAmount,
      durationMin,
      startTime,
      endTime
    } = body;

    // Basic validation
    if (!customerId || !artistId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Transaction to check availability and hold the slot
    const result = await prisma.$transaction(async (tx) => {
      // a. Check if the slot is still available for the artist
      const overlappingBookings = await tx.booking.findMany({
        where: {
          artistId,
          status: {
            notIn: ['CANCELLED', 'NO_SHOW', 'EXPIRED']
          },
          OR: [
            {
              startTime: { lt: new Date(endTime) },
              endTime: { gt: new Date(startTime) }
            }
          ]
        }
      });

      if (overlappingBookings.length > 0) {
        throw new Error('SLOT_TAKEN');
      }

      // b. Create a ServiceRequest (Simplified for MVP hold)
      const serviceRequest = await tx.serviceRequest.create({
        data: {
          customerId,
          serviceType: serviceType || 'TATTOO',
          status: 'ACCEPTED' // Auto accept for flash/consultation
        }
      });

      // c. Create a Quote
      const quote = await tx.quote.create({
        data: {
          serviceRequestId: serviceRequest.id,
          totalPrice: totalPrice || 0,
          depositAmount: depositAmount || 0,
          upfrontPayment: depositAmount || 0,
          durationMin: durationMin || 60,
          status: 'ACCEPTED',
          // Hold expires in 10 minutes
          expiresAt: new Date(Date.now() + 10 * 60000)
        }
      });

      // d. Create Booking with PENDING_DEPOSIT
      const booking = await tx.booking.create({
        data: {
          customerId,
          artistId,
          quoteId: quote.id,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status: 'PENDING_DEPOSIT'
        },
        include: {
          quote: true
        }
      });

      return booking;
    });

    return NextResponse.json({ booking: result });
  } catch (error: any) {
    if (error.message === 'SLOT_TAKEN') {
      return NextResponse.json({ error: 'Selected slot is no longer available' }, { status: 409 });
    }
    console.error('Hold Booking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
