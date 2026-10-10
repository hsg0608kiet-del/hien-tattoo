import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get('artistId');
  const dateStr = searchParams.get('date'); // YYYY-MM-DD
  const durationMin = parseInt(searchParams.get('durationMin') || '60', 10);

  if (!artistId || !dateStr) {
    return NextResponse.json({ error: 'artistId and date are required' }, { status: 400 });
  }

  // 1. Parse dates
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  try {
    // 2. Fetch existing bookings for the artist on that day
    // Exclude CANCELLED, NO_SHOW, EXPIRED bookings
    const bookings = await prisma.booking.findMany({
      where: {
        artistId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW', 'EXPIRED']
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // 3. Define working hours (Mocking 09:00 to 18:00 UTC)
    // In a real MVP, this should come from Artist settings
    const slots = [];
    let currentSlot = new Date(`${dateStr}T09:00:00.000Z`);
    const endWorkingHour = new Date(`${dateStr}T18:00:00.000Z`);

    // 4. Generate 30-min interval slots and check availability
    while (currentSlot < endWorkingHour) {
      const slotEnd = new Date(currentSlot.getTime() + durationMin * 60000);

      if (slotEnd > endWorkingHour) {
        break;
      }

      // Check overlap
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
