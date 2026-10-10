import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const session = await getServerSession();
  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch all bookings for the studio
  const bookings = await prisma.booking.findMany({
    include: {
      customer: true,
      artist: true,
      quote: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const totalRevenue = bookings
    .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.quote?.depositAmount || 0), 0);

  const pendingCount = bookings.filter(b => b.status === 'PENDING_DEPOSIT').length;

  return (
    <div className="w-full max-w-7xl animate-slide-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-neutral-400">Quản lý tổng quan hoạt động kinh doanh của Studio.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-dark p-6 rounded-2xl border border-neutral-800">
          <div className="text-sm text-neutral-400 mb-2">Tổng Tiền Cọc Đã Thu</div>
          <div className="text-3xl font-bold text-emerald-400">{totalRevenue.toLocaleString()} ₫</div>
        </div>
        <div className="glass-dark p-6 rounded-2xl border border-neutral-800">
          <div className="text-sm text-neutral-400 mb-2">Đang Chờ Cọc</div>
          <div className="text-3xl font-bold text-amber-400">{pendingCount} Booking</div>
        </div>
        <div className="glass-dark p-6 rounded-2xl border border-neutral-800">
          <div className="text-sm text-neutral-400 mb-2">Tổng Lịch Đã Đặt</div>
          <div className="text-3xl font-bold text-white">{bookings.length} Booking</div>
        </div>
      </div>

      {/* Booking List */}
      <div className="glass-dark rounded-2xl border border-neutral-800 overflow-hidden">
        <div className="p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-white">Tất cả Lịch hẹn</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900/50 text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-medium">Khách Hàng</th>
                <th className="px-6 py-4 font-medium">Artist</th>
                <th className="px-6 py-4 font-medium">Thời Gian</th>
                <th className="px-6 py-4 font-medium">Trạng Thái</th>
                <th className="px-6 py-4 font-medium">Tiền Cọc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{b.customer.name}</td>
                  <td className="px-6 py-4">{b.artist.name}</td>
                  <td className="px-6 py-4">{new Date(b.startTime).toLocaleString('vi-VN')}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      b.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      b.status === 'PENDING_DEPOSIT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-neutral-800 text-neutral-400'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{b.quote?.depositAmount.toLocaleString()} ₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
