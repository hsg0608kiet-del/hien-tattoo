import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ArtistDashboard() {
  // Mock Artist ID
  const artistId = 'artist-1';

  // Fetch upcoming bookings
  const bookings = await prisma.booking.findMany({
    where: {
      artistId,
      status: {
        in: ['PENDING_DEPOSIT', 'CONFIRMED']
      },
      startTime: {
        gte: new Date()
      }
    },
    orderBy: {
      startTime: 'asc'
    }
  });

  return (
    <div className="w-full max-w-5xl animate-slide-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Artist Dashboard</h1>
          <p className="text-neutral-400">Quản lý lịch làm việc và yêu cầu từ khách hàng.</p>
        </div>
        <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-sm text-neutral-300">
          Artist-1 (Online)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-dark p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              Lịch Sắp Tới 
              <span className="ml-3 bg-white text-black text-xs px-2 py-1 rounded-full">{bookings.length}</span>
            </h2>
            
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors">
                    <div className="mb-4 md:mb-0">
                      <div className="font-medium text-white mb-1">Khách Hàng (ID: {b.customerId})</div>
                      <div className="text-sm text-neutral-400">
                        {new Date(b.startTime).toLocaleString('vi-VN')} - {new Date(b.endTime).toLocaleTimeString('vi-VN')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {b.status === 'CONFIRMED' ? 'Đã Xác Nhận' : 'Chờ Cọc'}
                      </span>
                      <button className="text-sm px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors">
                        Chi Tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                Không có lịch sắp tới.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-dark p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-xl font-semibold mb-6">Thống Kê Nhanh</h2>
            <div className="space-y-4">
              <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
                <div className="text-sm text-neutral-400 mb-1">Lịch trong tuần</div>
                <div className="text-2xl font-bold text-white">12 ca</div>
              </div>
              <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
                <div className="text-sm text-neutral-400 mb-1">Yêu cầu thiết kế chờ duyệt</div>
                <div className="text-2xl font-bold text-amber-400">3 yêu cầu</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
