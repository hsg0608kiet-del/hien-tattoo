import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { action, rejectReason } = body;
    const role = (session.user as any).role;

    if (action === 'APPROVE') {
      if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: 'APPROVED', // Approved by Admin -> Ready for deposit or confirmed
          rejectReason: null
        }
      });
      return NextResponse.json({ booking: updated });
    }

    if (action === 'REJECT') {
      if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!rejectReason || !rejectReason.trim()) {
        return NextResponse.json({ error: 'Vui lòng nhập lý do từ chối lịch hẹn!' }, { status: 400 });
      }
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectReason: rejectReason.trim()
        }
      });
      return NextResponse.json({ booking: updated });
    }

    if (action === 'COMPLETE') {
      if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const updated = await prisma.booking.update({
        where: { id },
        data: { status: 'COMPLETED' }
      });
      return NextResponse.json({ booking: updated });
    }

    if (action === 'CANCEL') {
      const updated = await prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });
      return NextResponse.json({ booking: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH Booking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
