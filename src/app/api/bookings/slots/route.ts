import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get('artistId') || 'admin-1';
  const dateStr = searchParams.get('date'); // YYYY-MM-DD
  const durationMin = parseInt(searchParams.get('durationMin') || '90', 10);

  if (!dateStr) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 });
  }

  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  try {
    // Exclude REJECTED, CANCELLED, NO_SHOW, EXPIRED bookings
    const bookings = await prisma.booking.findMany({
      where: {
        artistId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: ['REJECTED', 'CANCELLED', 'NO_SHOW', 'EXPIRED']
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    const slots = [];
    let currentSlot = new Date(`${dateStr}T09:00:00.000Z`);
    const endWorkingHour = new Date(`${dateStr}T20:00:00.000Z`);

    while (currentSlot < endWorkingHour) {
      const slotEnd = new Date(currentSlot.getTime() + durationMin * 60000);

      if (slotEnd > endWorkingHour) {
        break;
      }

      const isOverlapping = bookings.some(booking => {
        return (
          (currentSlot >= booking.startTime && currentSlot < booking.endTime) ||
          (slotEnd > booking.startTime && slotEnd <= booking.endTime) ||
          (currentSlot <= booking.startTime && slotEnd >= booking.endTime)
        );
      });

      if (!isOverlapping) {
        slots.push({
          startTime: currentSlot.toISOString(),
          endTime: slotEnd.toISOString()
        });
      }

      // Increment by 30 mins
      currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
