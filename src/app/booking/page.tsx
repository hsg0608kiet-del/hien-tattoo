'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function BookingWizardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPortfolioId = searchParams.get('portfolioId') || '';
  const initialCustomRequestId = searchParams.get('customRequestId') || '';

  const [step, setStep] = useState(1);
  const [bookingMode, setBookingMode] = useState<'PORTFOLIO' | 'CUSTOM'>(
    initialCustomRequestId ? 'CUSTOM' : 'PORTFOLIO'
  );

  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(initialPortfolioId);
  const [selectedCustomId, setSelectedCustomId] = useState(initialCustomRequestId);

  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  const role = (session?.user as any)?.role;

  // Redirect inside useEffect to avoid "Cannot update a component while rendering a different component"
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status === 'authenticated' && role === 'ADMIN') {
      // Role ADMIN không đặt lịch mà chuyển thẳng về trang Quản lý & Duyệt danh sách đặt lịch
      router.replace('/dashboard/admin');
      return;
    }
  }, [status, role, router]);

  useEffect(() => {
    async function loadOptions() {
      setInitLoading(true);
      try {
        const [pRes, cRes] = await Promise.all([
          fetch('/api/portfolio'),
          fetch('/api/custom-requests')
        ]);
        if (pRes.ok) {
          const pData = await pRes.json();
          setPortfolioItems(pData.items || []);
          if (!initialPortfolioId && pData.items?.length > 0 && !initialCustomRequestId) {
            setSelectedPortfolioId(pData.items[0].id);
          }
        }
        if (cRes.ok) {
          const cData = await cRes.json();
          const quotedOrAccepted = (cData.requests || []).filter(
            (r: any) => r.status === 'QUOTED' || r.status === 'ACCEPTED'
          );
          setCustomRequests(quotedOrAccepted);
        }
      } catch (e) {
        console.error(e);
      }
      setInitLoading(false);
    }

    if (status === 'authenticated' && role !== 'ADMIN') {
      loadOptions();
    }
  }, [status, role, initialPortfolioId, initialCustomRequestId]);

  if (status === 'loading' || status === 'unauthenticated' || role === 'ADMIN' || initLoading) {
    return (
      <div className="text-center py-20 animate-pulse text-neutral-400">
        Đang chuyển hướng...
      </div>
    );
  }

  const activePortfolio = portfolioItems.find((p) => p.id === selectedPortfolioId);
  const activeCustom = customRequests.find((c) => c.id === selectedCustomId);

  const selectedPrice =
    bookingMode === 'PORTFOLIO'
      ? activePortfolio?.estimatedPrice || 1200000
      : activeCustom?.quotedPrice || 1500000;

  const selectedDuration =
    bookingMode === 'PORTFOLIO'
      ? activePortfolio?.estimatedDuration || 90
      : activeCustom?.estimatedDuration || 120;

  const selectedDeposit = Math.round(selectedPrice * 0.25);

  const fetchSlots = async (selectedDate: string) => {
    setLoading(true);
    try {
      const artistId = activePortfolio?.artistId || 'admin-1';
      const res = await fetch(
        `/api/bookings/slots?artistId=${artistId}&date=${selectedDate}&durationMin=${selectedDuration}`
      );
      const data = await res.json();
      if (data.slots) {
        setSlots(data.slots);
      }
    } catch (error) {
      console.error('Failed to fetch slots', error);
    }
    setLoading(false);
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    try {
      const endTimeIso = new Date(new Date(slot).getTime() + selectedDuration * 60000).toISOString();

      const res = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: (session?.user as any)?.id,
          artistId: activePortfolio?.artistId || 'admin-1',
          portfolioItemId: bookingMode === 'PORTFOLIO' ? selectedPortfolioId : undefined,
          customRequestId: bookingMode === 'CUSTOM' ? selectedCustomId : undefined,
          serviceType: bookingMode === 'PORTFOLIO' ? 'PORTFOLIO_TATTOO' : 'CUSTOM_TATTOO',
          totalPrice: selectedPrice,
          depositAmount: selectedDeposit,
          durationMin: selectedDuration,
          startTime: slot,
          endTime: endTimeIso,
          note
        })
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/my-bookings?created=1');
      } else {
        alert(data.error || 'Có lỗi xảy ra, khung giờ có thể đã được đặt!');
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const canProceedStep1 =
    (bookingMode === 'PORTFOLIO' && !!selectedPortfolioId) ||
    (bookingMode === 'CUSTOM' && !!selectedCustomId);

  return (
    <div className="w-full max-w-4xl mx-auto glass-dark p-4 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl animate-slide-up border border-neutral-800 shadow-2xl">
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-neutral-400 text-xs break-words">
          Khách hàng: <span className="text-white font-semibold">{session?.user?.name}</span> — SĐT:{' '}
          <span className="text-emerald-400 font-semibold">{(session?.user as any)?.phone || session?.user?.email}</span>
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 sm:mb-10 relative max-w-xs sm:max-w-lg mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-800 -z-10 rounded-full transform -translate-y-1/2"></div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 transition-colors ${
              step >= i ? 'bg-white text-black border-white' : 'bg-neutral-900 text-neutral-500 border-neutral-700'
            }`}
          >
            {i}
          </div>
        ))}
      </div>

      <h2 className="text-lg sm:text-2xl font-bold mb-5 sm:mb-6 text-center leading-snug">
        {step === 1 && 'Bước 1: Chọn Hình Xăm Mẫu hoặc Ý Tưởng Đã Báo Giá'}
        {step === 2 && 'Bước 2: Chọn Ngày & Khung Giờ Trống'}
        {step === 3 && 'Bước 3: Xác Nhận Yêu Cầu Đặt Lịch'}
      </h2>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setBookingMode('PORTFOLIO')}
              className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                bookingMode === 'PORTFOLIO' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Đặt Theo Hình Có Sẵn ({portfolioItems.length})
            </button>
            <button
              type="button"
              onClick={() => setBookingMode('CUSTOM')}
              className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                bookingMode === 'CUSTOM' ? 'bg-amber-400 text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Đặt Theo Ý Tưởng Riêng Đã Báo Giá ({customRequests.length})
            </button>
          </div>

          {bookingMode === 'PORTFOLIO' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-h-[420px] overflow-y-auto pr-1">
              {portfolioItems.map((item) => {
                const selected = selectedPortfolioId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPortfolioId(item.id)}
                    className={`flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
                      selected
                        ? 'border-white bg-white/10 shadow-lg'
                        : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-600'
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-neutral-800 shrink-0"
                    />
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <h4 className="font-bold text-white text-sm sm:text-base truncate">{item.title}</h4>
                        <p className="text-xs text-neutral-400 truncate">{item.style} • {item.placement}</p>
                      </div>
                      <div className="flex flex-wrap justify-between items-center gap-1 mt-2 pt-2 border-t border-neutral-800 text-xs">
                        <span className="font-bold text-amber-400">{item.estimatedPrice.toLocaleString('vi-VN')} ₫</span>
                        <span className="text-neutral-300">⏱ {item.estimatedDuration} phút</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {customRequests.length === 0 ? (
                <div className="text-center py-8 sm:py-10 px-4 bg-neutral-900/40 rounded-2xl border border-neutral-800">
                  <p className="text-neutral-400 text-xs sm:text-sm mb-4">
                    Bạn chưa có yêu cầu ý tưởng riêng nào được Admin báo giá.
                  </p>
                  <Link
                    href="/custom-request"
                    className="inline-block w-full sm:w-auto px-6 py-3 bg-amber-400 text-black font-bold rounded-full text-xs hover:bg-amber-300"
                  >
                    + Gửi Ý Tưởng Xăm Riêng Ngay
                  </Link>
                </div>
              ) : (
                customRequests.map((req) => {
                  const imgs = JSON.parse(req.imagesJson || '[]');
                  const selected = selectedCustomId === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedCustomId(req.id)}
                      className={`flex flex-col sm:flex-row gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
                        selected
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-600'
                      }`}
                    >
                      {imgs[0] && (
                        <img src={imgs[0]} alt="Custom" className="w-full sm:w-24 h-36 sm:h-24 rounded-xl object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <span className="text-xs font-bold text-amber-400">Ý tưởng riêng ({req.placement} - {req.size})</span>
                          <span className="text-[11px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">
                            Đã có báo giá
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-white mt-1 line-clamp-2">{req.description}</p>
                        <div className="flex flex-wrap gap-3 sm:gap-6 mt-3 text-xs text-neutral-300">
                          <span>Báo giá: <strong className="text-amber-400">{req.quotedPrice?.toLocaleString('vi-VN')} ₫</strong></span>
                          <span>Thời lượng: <strong className="text-white">{req.estimatedDuration} phút</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div className="flex justify-end pt-3 sm:pt-4">
            <button
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-black rounded-full font-bold disabled:opacity-50 hover:bg-neutral-200 transition-all text-sm sm:text-base"
            >
              Tiếp Tục Chọn Giờ →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-5 sm:space-y-6 animate-fade-in">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs sm:text-sm">
            <div>
              <span className="text-neutral-400">Mẫu đã chọn: </span>
              <strong className="text-white">
                {bookingMode === 'PORTFOLIO' ? activePortfolio?.title : `Ý tưởng riêng (${activeCustom?.placement})`}
              </strong>
            </div>
            <div className="sm:text-right">
              <span className="text-amber-400 font-bold">{selectedPrice.toLocaleString('vi-VN')} ₫</span>
              <span className="text-neutral-400 ml-2 sm:ml-3">({selectedDuration} phút)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-2">Chọn Ngày Xăm</label>
            <input
              type="date"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm sm:text-base text-white focus:outline-none focus:border-white transition-colors"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setDate(e.target.value);
                setSlot('');
                fetchSlots(e.target.value);
              }}
            />
          </div>

          {date && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-2">
                Khung Giờ Trống Khả Dụng (Thời lượng: {selectedDuration} phút)
              </label>
              {loading ? (
                <div className="animate-pulse grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-neutral-800 rounded-xl"></div>
                  ))}
                </div>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                  {slots.map((s, i) => {
                    const startStr = new Date(s.startTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const endStr = new Date(s.endTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSlot(s.startTime)}
                        className={`py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                          slot === s.startTime
                            ? 'bg-white text-black border-white shadow-lg'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600'
                        }`}
                      >
                        {startStr} - {endStr}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-neutral-500 text-xs sm:text-sm py-4">Không còn khung giờ trống đủ {selectedDuration} phút trong ngày này.</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-2">Ghi chú thêm cho Artist (Tuỳ chọn)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Mình muốn ủ tê trước khi xăm, hoặc cần tư vấn thêm..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-6 sm:mt-8">
            <button
              onClick={() => setStep(1)}
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-neutral-800 sm:border-0 text-neutral-400 hover:text-white transition-colors text-sm"
            >
              ← Quay Lại
            </button>
            <button
              disabled={!slot}
              onClick={() => setStep(3)}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-black rounded-full font-bold disabled:opacity-50 hover:bg-neutral-200 transition-all text-sm sm:text-base"
            >
              Tiếp Tục Xác Nhận →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-5 sm:space-y-6 animate-fade-in">
          <div className="p-4 sm:p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3 text-xs sm:text-sm">
            <h3 className="font-bold text-base sm:text-lg text-white mb-2 sm:mb-3">Chi Tiết Phiếu Đặt Lịch</h3>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-neutral-400">Loại hình xăm:</span>
              <span className="font-semibold text-white sm:text-right">
                {bookingMode === 'PORTFOLIO'
                  ? `Mẫu có sẵn: ${activePortfolio?.title}`
                  : `Thiết kế riêng (${activeCustom?.placement})`}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-neutral-400">Thời gian hẹn:</span>
              <span className="font-semibold text-emerald-400">{new Date(slot).toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Thời lượng dự kiến:</span>
              <span className="font-semibold text-white">{selectedDuration} phút</span>
            </div>
            {note && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-neutral-400">Ghi chú:</span>
                <span className="text-neutral-200 sm:text-right">{note}</span>
              </div>
            )}
            <div className="h-px bg-neutral-800 my-3"></div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-neutral-400">Tổng chi phí dự kiến:</span>
              <span className="font-bold text-amber-400">{selectedPrice.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-neutral-400">Tiền cọc giữ lịch (25%):</span>
              <span className="font-semibold text-white">{selectedDeposit.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-6 sm:mt-8">
            <button
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-neutral-800 sm:border-0 text-neutral-400 hover:text-white transition-colors text-sm"
            >
              ← Quay Lại
            </button>
            <button
              disabled={loading}
              onClick={handleCreateBooking}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white rounded-full font-bold hover:bg-emerald-600 transition-all shadow-lg text-sm sm:text-base"
            >
              {loading ? 'Đang gửi yêu cầu...' : 'Xác Nhận Đặt Lịch Hẹn'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingWizard() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-neutral-400">Đang tải...</div>}>
      <BookingWizardContent />
    </Suspense>
  );
}
