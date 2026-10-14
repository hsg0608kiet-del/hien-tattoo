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

    const whereClause = role === 'ADMIN' ? {} : { clientId: userId };

    const requests = await prisma.customRequest.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true }
        },
        bookings: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('GET CustomRequests Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để gửi ý tưởng xăm' }, { status: 401 });
    }

    const body = await request.json();
    const { images, description, placement, size } = body;

    if (!images || !Array.isArray(images) || images.length === 0 || !description || !placement || !size) {
      return NextResponse.json(
        { error: 'Vui lòng tải lên ít nhất 1 ảnh ý tưởng và điền đầy đủ vị trí, kích thước, mô tả!' },
        { status: 400 }
      );
    }

    const customRequest = await prisma.customRequest.create({
      data: {
        clientId: (session.user as any).id,
        imagesJson: JSON.stringify(images),
        description: description.trim(),
        placement: placement.trim(),
        size: size.trim(),
        status: 'PENDING'
      }
    });

    return NextResponse.json({ request: customRequest }, { status: 201 });
  } catch (error) {
    console.error('POST CustomRequest Error:', error);
    return NextResponse.json({ error: 'Lỗi khi gửi yêu cầu thiết kế riêng' }, { status: 500 });
  }
}
