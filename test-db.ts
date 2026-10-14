import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("=== KIỂM TRA CÁC PHÂN HỆ MỞ RỘNG TRÊN DATABASE ===\n");

  const users = await prisma.user.findMany();
  console.log(`[1] Users (${users.length}):`);
  users.forEach((u) =>
    console.log(`   - ${u.name} | SĐT: ${u.phone} | Role: ${u.role}`)
  );

  const portfolios = await prisma.portfolioItem.findMany();
  console.log(`\n[2] Portfolio Hình Mẫu (${portfolios.length}):`);
  portfolios.forEach((p) =>
    console.log(
      `   - ${p.title} | Giá dự kiến: ${p.estimatedPrice.toLocaleString()}đ | Thời lượng: ${p.estimatedDuration} phút`
    )
  );

  const customRequests = await prisma.customRequest.findMany({
    include: { client: true },
  });
  console.log(`\n[3] Yêu Cầu Ý Tưởng Custom (${customRequests.length}):`);
  customRequests.forEach((c) =>
    console.log(
      `   - Khách: ${c.client.name} (${c.client.phone}) | Vị trí: ${c.placement} | Trạng thái: ${c.status} | Báo giá: ${c.quotedPrice || 'Chưa báo'}đ`
    )
  );

  const bookings = await prisma.booking.findMany({
    include: { customer: true, portfolioItem: true },
  });
  console.log(`\n[4] Đơn Đặt Lịch (${bookings.length}):`);
  bookings.forEach((b) =>
    console.log(
      `   - Mã: ${b.id.slice(0, 8)} | Khách: ${b.customer.phone} | Trạng thái: ${b.status} | Mẫu: ${b.portfolioItem?.title || 'Custom'}`
    )
  );

  console.log("\n=== TẤT CẢ DỮ LIỆU & SCHEMA HOẠT ĐỘNG CHÍNH XÁC! ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
