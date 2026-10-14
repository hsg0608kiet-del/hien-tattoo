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
    const role = (session.user as any).role;

    // 1. Admin quotes price & estimated duration, or rejects
    if (role === 'ADMIN' && body.action === 'QUOTE') {
      const { quotedPrice, estimatedDuration, adminNote } = body;
      if (!quotedPrice || !estimatedDuration) {
        return NextResponse.json(
          { error: 'Vui lòng nhập Giá báo và Thời gian thực hiện ước tính (phút)!' },
          { status: 400 }
        );
      }

      const updated = await prisma.customRequest.update({
        where: { id },
        data: {
          quotedPrice: Number(quotedPrice),
          estimatedDuration: Number(estimatedDuration),
          adminNote: adminNote?.trim() || null,
          status: 'QUOTED'
        }
      });

      return NextResponse.json({ request: updated });
    }

    if (role === 'ADMIN' && body.action === 'REJECT') {
      const updated = await prisma.customRequest.update({
        where: { id },
        data: {
          adminNote: body.adminNote?.trim() || 'Studio hiện chưa nhận mẫu này.',
          status: 'REJECTED'
        }
      });
      return NextResponse.json({ request: updated });
    }

    // 2. Client accepts or declines quote
    if (body.action === 'ACCEPT_QUOTE') {
      const updated = await prisma.customRequest.update({
        where: { id },
        data: {
          status: 'ACCEPTED'
        }
      });
      return NextResponse.json({ request: updated });
    }

    return NextResponse.json({ error: 'Invalid action or insufficient permissions' }, { status: 400 });
  } catch (error) {
    console.error('PATCH CustomRequest Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
