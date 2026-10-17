'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING_APPROVAL: {
    label: 'Chờ Admin Duyệt',
    className: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
  APPROVED: {
    label: 'Đã Chấp Nhận (Chờ Cọc)',
    className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  },
  PENDING_DEPOSIT: {
    label: 'Cần Đặt Cọc',
    className: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
  CONFIRMED: {
    label: 'Đã Xác Nhận & Đã Cọc',
    className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  },
  REJECTED: {
    label: 'Từ Chối',
    className: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  COMPLETED: {
    label: 'Hoàn Thành',
    className: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  },
  CANCELLED: {
    label: 'Đã Hủy',
    className: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
  },
};

export default function MyBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        fetch('/api/bookings/my'),
        fetch('/api/custom-requests'),
      ]);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData.bookings || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCustomRequests(cData.requests || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);

  const handleAcceptQuoteAndBook = async (customReqId: string) => {
    await fetch(`/api/custom-requests/${customReqId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ACCEPT_QUOTE' }),
    });
    router.push(`/booking?customRequestId=${customReqId}`);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CANCEL' }),
    });
    if (res.ok) {
      loadData();
    }
  };

  if (status === 'loading' || loading) {
    return <div className="text-center py-20 text-neutral-400 animate-pulse">Đang tải dữ liệu của bạn...</div>;
  }

  return (
    <div className="w-full max-w-6xl animate-slide-up space-y-10 sm:space-y-14">
      {/* SECTION 1: Custom Tattoo Requests & Notifications */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Ý Tưởng Xăm Riêng & Báo Giá Từ Studio</h1>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1">
              Theo dõi phản hồi báo giá và thời gian thực hiện dự kiến từ Admin cho các mẫu thiết kế riêng của bạn.
            </p>
          </div>
          <Link
            href="/custom-request"
            className="w-full sm:w-auto text-center px-5 py-2.5 bg-amber-400 text-black font-bold rounded-full text-xs sm:text-sm hover:bg-amber-300 transition-all self-start shrink-0"
          >
            + Gửi Ý Tưởng Mới
          </Link>
        </div>

        {customRequests.length === 0 ? (
          <div className="glass-dark p-6 sm:p-8 rounded-2xl border border-neutral-800 text-center text-neutral-400 text-xs sm:text-sm">
            Bạn chưa gửi yêu cầu thiết kế hình xăm riêng nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {customRequests.map((req) => {
              const images: string[] = JSON.parse(req.imagesJson || '[]');
              return (
                <div
                  key={req.id}
                  className="glass-dark p-4 sm:p-6 rounded-2xl border border-neutral-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                      <div>
                        <span className="text-xs text-neutral-400">Vị trí: {req.placement} • Kích thước: {req.size}</span>
                        <h3 className="font-bold text-white text-base sm:text-lg mt-0.5">{req.description}</h3>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap self-start ${
                          req.status === 'QUOTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                            : req.status === 'ACCEPTED' || req.status === 'BOOKED'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : req.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {req.status === 'PENDING' && 'Đang Chờ Báo Giá'}
                        {req.status === 'QUOTED' && '🔔 Đã Có Báo Giá Mới!'}
                        {req.status === 'ACCEPTED' && 'Đã Chấp Nhận Giá'}
                        {req.status === 'BOOKED' && 'Đã Đặt Lịch Xăm'}
                        {req.status === 'REJECTED' && 'Từ Chối'}
                      </span>
                    </div>

                    {/* Uploaded Reference Images */}
                    {images.length > 0 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                        {images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="Ref"
                            className="w-20 h-20 rounded-xl object-cover border border-neutral-700 shrink-0"
                          />
                        ))}
                      </div>
                    )}

                    {/* Quote Box from Admin */}
                    {(req.status === 'QUOTED' || req.status === 'ACCEPTED' || req.status === 'BOOKED') && (
                      <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs sm:text-sm mb-4">
                        <div className="font-bold text-emerald-300">Bảng Báo Giá Từ Admin Studio:</div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Chi phí thực hiện:</span>
                          <span className="font-bold text-amber-400 text-sm sm:text-base">
                            {req.quotedPrice?.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Thời gian ước tính:</span>
                          <span className="font-semibold text-white">{req.estimatedDuration} phút</span>
                        </div>
                        {req.adminNote && (
                          <div className="text-xs text-neutral-300 pt-1 border-t border-emerald-500/20">
                            <strong>Lời nhắn từ Artist:</strong> {req.adminNote}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {(req.status === 'QUOTED' || req.status === 'ACCEPTED') && (
                    <button
                      onClick={() => handleAcceptQuoteAndBook(req.id)}
                      className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all text-xs sm:text-sm"
                    >
                      Chấp Nhận Báo Giá & Chọn Ngày Giờ Đặt Lịch →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Booking History */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Lịch Sử Đơn Đặt Lịch Của Tôi</h2>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1">
              Theo dõi trạng thái đơn đặt lịch: Chờ duyệt, Đã chấp nhận, Cần cọc, hoặc Từ chối (kèm lý do).
            </p>
          </div>
          <Link
            href="/booking"
            className="w-full sm:w-auto text-center px-5 py-2.5 bg-white text-black font-bold rounded-full text-xs sm:text-sm hover:bg-neutral-200 transition-all self-start shrink-0"
          >
            + Đặt Lịch Mới
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4 glass-dark rounded-2xl sm:rounded-3xl border border-neutral-800">
            <p className="text-neutral-500 mb-6 text-sm">Bạn chưa có lịch hẹn nào.</p>
            <Link href="/portfolio" className="inline-block w-full sm:w-auto px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 text-sm">
              Chọn Mẫu & Đặt Lịch Ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {bookings.map((b) => {
              const badge = STATUS_BADGE[b.status] || {
                label: b.status,
                className: 'bg-neutral-800 text-neutral-300',
              };

              return (
                <div
                  key={b.id}
                  className="glass-dark p-4 sm:p-6 rounded-2xl border border-neutral-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-white">
                          {b.portfolioItem
                            ? b.portfolioItem.title
                            : b.customRequest
                            ? `Hình xăm thiết kế riêng (${b.customRequest.placement})`
                            : 'Lịch Hẹn Xăm Hình'}
                        </h3>
                        <p className="text-xs text-neutral-500">Mã đơn: #{b.id.slice(0, 8)}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold self-start whitespace-nowrap ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4 text-xs sm:text-sm bg-neutral-900/50 p-3.5 sm:p-4 rounded-xl border border-neutral-800/80">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                        <span className="text-neutral-400">Thời gian hẹn:</span>
                        <span className="font-semibold text-white">
                          {new Date(b.startTime).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Thời lượng dự kiến:</span>
                        <span className="text-white">{b.durationMin || b.quote?.durationMin || 90} phút</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Tổng giá:</span>
                        <span className="font-bold text-amber-400">
                          {(b.totalPrice || b.quote?.totalPrice || 0).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Tiền cọc giữ chỗ:</span>
                        <span className="font-semibold text-emerald-400">
                          {(b.depositAmount || b.quote?.depositAmount || 0).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    </div>

                    {b.status === 'REJECTED' && b.rejectReason && (
                      <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 mb-4">
                        <strong>Lý do Studio từ chối:</strong> {b.rejectReason}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-3 border-t border-neutral-800">
                    {(b.status === 'APPROVED' || b.status === 'PENDING_DEPOSIT') && (
                      <Link
                        href={`/checkout/${b.id}`}
                        className="flex-1 text-center py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-emerald-600 transition-colors"
                      >
                        Thanh Toán Cọc Ngay
                      </Link>
                    )}

                    {(b.status === 'PENDING_APPROVAL' ||
                      b.status === 'APPROVED' ||
                      b.status === 'PENDING_DEPOSIT') && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-xl text-xs sm:text-sm hover:bg-neutral-800 hover:text-red-400 transition-colors"
                      >
                        Hủy Đơn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
