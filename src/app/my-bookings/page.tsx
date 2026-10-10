import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function MyBookingsPage() {
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const bookings = await prisma.booking.findMany({
    where: { customerId: (session.user as any).id },
    include: {
      artist: true,
      quote: {
        include: { serviceRequest: true }
      }
    },
    orderBy: { startTime: 'desc' }
  });

  return (
    <div className="w-full max-w-5xl animate-slide-up">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Lịch Hẹn Của Tôi</h1>
        <p className="text-neutral-400">Quản lý các lịch hẹn xăm hình và tư vấn của bạn.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20 glass-dark rounded-3xl border border-neutral-800">
          <p className="text-neutral-500 mb-6">Bạn chưa có lịch hẹn nào.</p>
          <Link href="/booking" className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors">
            Đặt Lịch Ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map(b => (
            <div key={b.id} className="glass-dark p-6 rounded-2xl border border-neutral-800 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-white">{b.quote?.serviceRequest?.serviceType || 'TATTOO'}</h3>
                    <p className="text-sm text-neutral-400">ID: {b.id.slice(0,8)}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    b.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    b.status === 'PENDING_DEPOSIT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    b.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-neutral-800 text-neutral-400'
                  }`}>
                    {b.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex text-neutral-300">
                    <span className="w-24 text-neutral-500">Thời gian:</span>
                    <span>{new Date(b.startTime).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex text-neutral-300">
                    <span className="w-24 text-neutral-500">Artist:</span>
                    <span>{b.artist.name}</span>
                  </div>
                  {b.quote && (
                    <div className="flex text-neutral-300">
                      <span className="w-24 text-neutral-500">Đã cọc:</span>
                      <span className="font-medium text-white">{b.quote.depositAmount.toLocaleString()} ₫</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions based on status */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-neutral-800">
                {b.status === 'PENDING_DEPOSIT' && (
                  <Link href={`/checkout/${b.id}`} className="flex-1 text-center py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors">
                    Thanh Toán Cọc
                  </Link>
                )}
                
                {(b.status === 'PENDING_DEPOSIT' || b.status === 'CONFIRMED') && (
                  <button className="flex-1 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors">
                    Hủy Lịch
                  </button>
                )}

                {b.status === 'COMPLETED' && (
                  <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Đánh Giá
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
