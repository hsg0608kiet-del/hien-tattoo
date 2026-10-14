const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data in reverse dependency order for clean schema migration
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.customRequest.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Admin / Studio Owner / Artist
  const admin = await prisma.user.create({
    data: {
      id: 'admin-1',
      name: 'Hiển Master Artist (Admin)',
      phone: '0988888888',
      email: 'admin@example.com',
      password: '123',
      role: 'ADMIN',
      portfolioItems: {
        create: [
          {
            id: 'portfolio-1',
            title: 'Rồng Châu Á - Kín Lưng',
            imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&q=80',
            style: 'Asian Traditional',
            placement: 'Lưng',
            description: 'Tác phẩm rồng uốn lượn phong cách truyền thống Nhật cổ kết hợp tả thực bóng khói.',
            estimatedPrice: 8000000,
            estimatedDuration: 240, // 4 hours
            isFlash: false
          },
          {
            id: 'portfolio-2',
            title: 'Hoa Hồng Fine Line Tinh Tế',
            imageUrl: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?w=800&q=80',
            style: 'Fine Line',
            placement: 'Cổ Tay / Bắp Tay',
            description: 'Nét mảnh thanh lịch, phù hợp cho người mới bắt đầu xăm lần đầu.',
            estimatedPrice: 1200000,
            estimatedDuration: 90, // 1.5 hours
            isFlash: true
          },
          {
            id: 'portfolio-3',
            title: 'La Bàn & Mỏ Neo Blackwork',
            imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&q=80',
            style: 'Blackwork',
            placement: 'Cẳng Tay',
            description: 'Biểu tượng định hướng và sự kiên định, đánh bóng sắc nét.',
            estimatedPrice: 2500000,
            estimatedDuration: 120, // 2 hours
            isFlash: true
          },
          {
            id: 'portfolio-4',
            title: 'Cá Chép Hóa Rồng Mini',
            imageUrl: 'https://images.unsplash.com/photo-1590246814883-57c511a76917?w=800&q=80',
            style: 'Neo Traditional',
            placement: 'Bắp Chân',
            description: 'Màu sắc rực rỡ, mang ý nghĩa may mắn và vượt vũ môn.',
            estimatedPrice: 3500000,
            estimatedDuration: 180, // 3 hours
            isFlash: true
          }
        ]
      }
    }
  });

  // 2. Create Client Account
  const client = await prisma.user.create({
    data: {
      id: 'client-1',
      name: 'Nguyễn Văn Khách',
      phone: '0901234567',
      email: 'customer1@example.com',
      password: '123',
      role: 'CLIENT',
    }
  });

  // 3. Create Sample Custom Tattoo Request (PENDING & QUOTED)
  await prisma.customRequest.create({
    data: {
      id: 'custom-1',
      clientId: client.id,
      imagesJson: JSON.stringify([
        'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=800&q=80'
      ]),
      description: 'Mình muốn xăm hình phượng hoàng lửa cách điệu theo nét mảnh dọc sống lưng, kết hợp hoa mẫu đơn.',
      placement: 'Sống lưng trên',
      size: '15cm x 8cm',
      status: 'QUOTED',
      quotedPrice: 3200000,
      estimatedDuration: 150,
      adminNote: 'Mẫu này studio sẽ thiết kế riêng nét mảnh pha màu nước nhẹ. Thời gian xăm khoảng 2.5 tiếng nhé bạn!'
    }
  });

  await prisma.customRequest.create({
    data: {
      id: 'custom-2',
      clientId: client.id,
      imagesJson: JSON.stringify([
        'https://images.unsplash.com/photo-1542727365-19732a80dcfd?w=800&q=80'
      ]),
      description: 'Hình dòng chữ kỷ niệm gia đình kèm biểu tượng vô cực nhỏ.',
      placement: 'Xương quai xanh',
      size: '8cm x 3cm',
      status: 'PENDING'
    }
  });

  // 4. Create a Sample Booking
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(10, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow.getTime() + 90 * 60000);

  await prisma.booking.create({
    data: {
      id: 'booking-1',
      customerId: client.id,
      artistId: admin.id,
      portfolioItemId: 'portfolio-2',
      totalPrice: 1200000,
      depositAmount: 300000,
      durationMin: 90,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      status: 'PENDING_APPROVAL',
      note: 'Mình muốn xăm ở cổ tay trái, da hơi nhạy cảm nhờ shop chuẩn bị ủ tê giúp.'
    }
  });

  console.log('Seed data successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
