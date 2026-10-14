import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const items = await prisma.portfolioItem.findMany({
      include: {
        artist: {
          select: { id: true, name: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET Portfolio Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Chỉ Admin mới có quyền đăng hình mẫu' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      imageUrl,
      style,
      placement,
      description,
      estimatedPrice,
      estimatedDuration,
      isFlash
    } = body;

    if (!title || !imageUrl || estimatedPrice === undefined || estimatedDuration === undefined) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ Tên mẫu, Ảnh, Giá tiền dự kiến và Thời gian thực hiện!' },
        { status: 400 }
      );
    }

    const newItem = await prisma.portfolioItem.create({
      data: {
        artistId: (session.user as any).id,
        title: title.trim(),
        imageUrl: imageUrl.trim(),
        style: style?.trim() || 'Custom Style',
        placement: placement?.trim() || 'Tùy chọn',
        description: description?.trim() || '',
        estimatedPrice: Number(estimatedPrice),
        estimatedDuration: Number(estimatedDuration),
        isFlash: isFlash !== undefined ? Boolean(isFlash) : true,
      },
      include: {
        artist: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error('POST Portfolio Error:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo mẫu hình xăm mới' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing portfolio item id' }, { status: 400 });
    }

    await prisma.portfolioItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Portfolio Error:', error);
    return NextResponse.json({ error: 'Không thể xóa mẫu hình này (có thể đang gắn với lịch hẹn)' }, { status: 500 });
  }
}
