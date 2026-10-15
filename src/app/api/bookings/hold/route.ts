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
    const {
      customerId,
      artistId = 'admin-1',
      portfolioItemId,
      customRequestId,
      serviceType,
      totalPrice = 1200000,
      depositAmount = 300000,
      durationMin = 90,
      startTime,
      endTime,
      note
    } = body;

    const finalCustomerId = customerId || (session.user as any).id;

    if (!finalCustomerId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Vui lòng chọn ngày và khung giờ đặt lịch!' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let targetArtistId = artistId;
      const artistExists = await tx.user.findUnique({ where: { id: targetArtistId } });
      if (!artistExists) {
        const firstAdmin = await tx.user.findFirst({ where: { role: 'ADMIN' } });
        if (firstAdmin) targetArtistId = firstAdmin.id;
      }

      const overlappingBookings = await tx.booking.findMany({
        where: {
          artistId: targetArtistId,
          status: {
            notIn: ['REJECTED', 'CANCELLED', 'NO_SHOW', 'EXPIRED']
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

      const serviceRequest = await tx.serviceRequest.create({
        data: {
          customerId: finalCustomerId,
          serviceType: serviceType || (customRequestId ? 'CUSTOM_TATTOO' : 'PORTFOLIO_TATTOO'),
          status: 'ACCEPTED'
        }
      });

      const quote = await tx.quote.create({
        data: {
          serviceRequestId: serviceRequest.id,
          totalPrice: Number(totalPrice),
          depositAmount: Number(depositAmount),
          upfrontPayment: Number(depositAmount),
          durationMin: Number(durationMin),
          status: 'ACCEPTED',
          expiresAt: new Date(Date.now() + 24 * 60 * 60000)
        }
      });

      if (customRequestId) {
        await tx.customRequest.update({
          where: { id: customRequestId },
          data: { status: 'BOOKED' }
        });
      }

      const booking = await tx.booking.create({
        data: {
          customerId: finalCustomerId,
          artistId: targetArtistId,
          portfolioItemId: portfolioItemId || null,
          customRequestId: customRequestId || null,
          quoteId: quote.id,
          totalPrice: Number(totalPrice),
          depositAmount: Number(depositAmount),
          durationMin: Number(durationMin),
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status: 'PENDING_APPROVAL',
          note: note?.trim() || null
        },
        include: {
          quote: true,
          portfolioItem: true,
          customRequest: true
        }
      });

      return booking;
    });

    return NextResponse.json({ booking: result }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'SLOT_TAKEN') {
      return NextResponse.json({ error: 'Khung giờ này vừa có khách đặt, vui lòng chọn khung giờ khác!' }, { status: 409 });
    }
    console.error('Hold Booking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
