'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'BOOKINGS' | 'CUSTOM_REQUESTS' | 'PORTFOLIO'>('BOOKINGS');
  const [bookings, setBookings] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'BOOKINGS' || tabParam === 'CUSTOM_REQUESTS' || tabParam === 'PORTFOLIO') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Reject Modal / State for Bookings
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Quote Form State for Custom Requests
  const [quotingId, setQuotingId] = useState<string | null>(null);
  const [quotedPrice, setQuotedPrice] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('120');
  const [adminNote, setAdminNote] = useState('');

  // New Portfolio Form State
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [style, setStyle] = useState('Fine Line');
  const [placement, setPlacement] = useState('Cổ Tay / Cẳng Tay');
  const [description, setDescription] = useState('');
  const [portfolioPrice, setPortfolioPrice] = useState('1500000');
  const [portfolioDuration, setPortfolioDuration] = useState('120');
  const [submitting, setSubmitting] = useState(false);

  // Reminder Job & HTML Preview Modal State
  const [runningReminder, setRunningReminder] = useState(false);
  const [reminderPreview, setReminderPreview] = useState<{
    message: string;
    customerHtml?: string;
    ownerHtml?: string;
    activeView: 'CUSTOMER' | 'OWNER';
  } | null>(null);

  const handleTriggerReminderJob = async (bookingId?: string) => {
    setRunningReminder(true);
    try {
      const res = await fetch('/api/cron/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, hoursAhead: 72, force: true }),
      });
      const data = await res.json();
      if (res.ok) {
        const firstResult = data.results?.[0];
        setReminderPreview({
          message: data.message,
          customerHtml: firstResult?.previewCustomerHtml,
          ownerHtml: firstResult?.previewOwnerHtml,
          activeView: 'CUSTOMER',
        });
        await fetchAllAdminData();
      } else {
        alert(data.error || 'Lỗi khi chạy Job nhắc lịch hẹn!');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ!');
    }
    setRunningReminder(false);
  };

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes, pRes] = await Promise.all([
        fetch('/api/bookings/my'),
        fetch('/api/custom-requests'),
        fetch('/api/portfolio'),
      ]);

      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData.bookings || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCustomRequests(cData.requests || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPortfolioItems(pData.items || []);
      }
    } catch (error) {
      console.error('Admin Fetch Error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchAllAdminData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session]);

  const handleApproveBooking = async (bookingId: string) => {
    setSubmitting(true);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'APPROVE' }),
    });
    if (res.ok) {
      await fetchAllAdminData();
    }
    setSubmitting(false);
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối lịch hẹn để gửi cho khách hàng!');
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REJECT', rejectReason }),
    });
    if (res.ok) {
      setRejectingBookingId(null);
      setRejectReason('');
      await fetchAllAdminData();
    }
    setSubmitting(false);
  };

  const handleSendQuote = async (customId: string) => {
    if (!quotedPrice || !estimatedDuration) {
      alert('Vui lòng nhập đầy đủ Giá tiền dự kiến và Thời gian thực hiện (phút)!');
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/custom-requests/${customId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'QUOTE',
        quotedPrice: Number(quotedPrice),
        estimatedDuration: Number(estimatedDuration),
        adminNote,
      }),
    });
    if (res.ok) {
      setQuotingId(null);
      setQuotedPrice('');
      setEstimatedDuration('120');
      setAdminNote('');
      await fetchAllAdminData();
    }
    setSubmitting(false);
  };

  const handlePortfolioImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setImageUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl || !portfolioPrice || !portfolioDuration) {
      alert('Vui lòng điền đầy đủ thông tin hình mẫu!');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        imageUrl,
        style,
        placement,
        description,
        estimatedPrice: Number(portfolioPrice),
        estimatedDuration: Number(portfolioDuration),
        isFlash: true,
      }),
    });
    if (res.ok) {
      setTitle('');
      setImageUrl('');
      setDescription('');
      await fetchAllAdminData();
    } else {
      const err = await res.json();
      alert(err.error || 'Lỗi đăng mẫu');
    }
    setSubmitting(false);
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Xóa mẫu hình xăm này khỏi Portfolio?')) return;
    const res = await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchAllAdminData();
    } else {
      alert('Không thể xóa mẫu đang gắn với lịch hẹn!');
    }
  };

  if (status === 'loading' || loading) {
    return <div className="text-center py-20 text-neutral-400 animate-pulse">Đang tải hệ thống Quản trị Admin...</div>;
  }

  const pendingBookingsCount = bookings.filter((b) => b.status === 'PENDING_APPROVAL').length;
  const pendingCustomCount = customRequests.filter((c) => c.status === 'PENDING').length;

  return (
    <div className="w-full max-w-7xl animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
        <div>
          <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold">
            ADMIN STUDIO PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-2">Quản Trị Hiển Tattoo Studio</h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            Quản lý duyệt lịch hẹn, báo giá ý tưởng riêng (Custom Tattoo) và đăng tải Portfolio hình mẫu.
          </p>
        </div>

        <button
          type="button"
          disabled={runningReminder}
          onClick={() => handleTriggerReminderJob()}
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm transition-all shadow-lg disabled:opacity-50 shrink-0"
        >
          {runningReminder ? '⏳ Đang gửi mail nhắc lịch...' : '🔔 Chạy Job Nhắc Lịch Hẹn Ngay'}
        </button>
      </div>

      {/* Modal Xem Trước Email HTML Nhắc Lịch */}
      {reminderPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-emerald-400">✓ {reminderPreview.message}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Xem trước giao diện Email HTML đã tạo cho Khách hàng & Chủ Studio:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReminderPreview(null)}
                className="self-end sm:self-auto px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white"
              >
                ✕ Đóng
              </button>
            </div>

            {reminderPreview.customerHtml && (
              <>
                <div className="flex gap-2 p-3 bg-neutral-900/60 border-b border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setReminderPreview({ ...reminderPreview, activeView: 'CUSTOMER' })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      reminderPreview.activeView === 'CUSTOMER'
                        ? 'bg-emerald-500 text-black'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    📧 Template Gửi Khách Hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderPreview({ ...reminderPreview, activeView: 'OWNER' })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      reminderPreview.activeView === 'OWNER'
                        ? 'bg-purple-500 text-white'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    ⚡ Template Gửi Chủ Studio (Admin)
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-neutral-950 p-2 sm:p-4">
                  <iframe
                    title="Email HTML Preview"
                    srcDoc={
                      reminderPreview.activeView === 'CUSTOMER'
                        ? reminderPreview.customerHtml
                        : reminderPreview.ownerHtml
                    }
                    className="w-full h-[460px] rounded-xl border border-neutral-800 bg-neutral-950"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6 mb-6 sm:mb-8">
        <div
          onClick={() => setActiveTab('BOOKINGS')}
          className="glass-dark p-4 sm:p-6 rounded-2xl border border-neutral-800 cursor-pointer hover:border-amber-500/50 transition-colors"
        >
          <div className="text-xs sm:text-sm text-neutral-400 mb-1">Đơn Đặt Lịch Chờ Duyệt</div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400">{pendingBookingsCount} Yêu cầu</div>
          <div className="text-xs text-neutral-500 mt-1">Tổng cộng: {bookings.length} lịch hẹn</div>
        </div>
        <div
          onClick={() => setActiveTab('CUSTOM_REQUESTS')}
          className="glass-dark p-4 sm:p-6 rounded-2xl border border-neutral-800 cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          <div className="text-xs sm:text-sm text-neutral-400 mb-1">Ý Tưởng Custom Chờ Báo Giá</div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400">{pendingCustomCount} Ý tưởng</div>
          <div className="text-xs text-neutral-500 mt-1">Tổng cộng: {customRequests.length} yêu cầu</div>
        </div>
        <div
          onClick={() => setActiveTab('PORTFOLIO')}
          className="glass-dark p-4 sm:p-6 rounded-2xl border border-neutral-800 cursor-pointer hover:border-purple-500/50 transition-colors"
        >
          <div className="text-xs sm:text-sm text-neutral-400 mb-1">Kho Hình Xăm Mẫu (Portfolio)</div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-400">{portfolioItems.length} Tác phẩm</div>
          <div className="text-xs text-neutral-500 mt-1">Đã niêm yết giá & thời lượng</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 mb-6 sm:mb-8 border-b border-neutral-800 pb-4">
        <button
          onClick={() => setActiveTab('BOOKINGS')}
          className={`w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-left sm:text-center ${
            activeTab === 'BOOKINGS'
              ? 'bg-white text-black shadow-lg'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          1. Quản Lý & Duyệt Đặt Lịch ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('CUSTOM_REQUESTS')}
          className={`w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-left sm:text-center ${
            activeTab === 'CUSTOM_REQUESTS'
              ? 'bg-amber-400 text-black shadow-lg'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          2. Báo Giá Ý Tưởng Custom ({customRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('PORTFOLIO')}
          className={`w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-left sm:text-center ${
            activeTab === 'PORTFOLIO'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          3. Quản Lý Portfolio Hình Mẫu ({portfolioItems.length})
        </button>
      </div>

      {/* TAB 1: BOOKING APPROVAL MANAGEMENT */}
      {activeTab === 'BOOKINGS' && (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="glass-dark p-4 sm:p-6 rounded-2xl border border-neutral-800 flex flex-col lg:flex-row justify-between gap-4 sm:gap-6"
            >
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="text-xs font-mono text-neutral-500">#{b.id.slice(0, 8)}</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${
                      b.status === 'PENDING_APPROVAL'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : b.status === 'APPROVED' || b.status === 'CONFIRMED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : b.status === 'REJECTED'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {b.status === 'PENDING_APPROVAL' && 'CHỜ DUYỆT'}
                    {b.status === 'APPROVED' && 'ĐÃ CHẤP NHẬN (CHỜ KHÁCH CỌC)'}
                    {b.status === 'CONFIRMED' && 'ĐÃ CỌC & XÁC NHẬN'}
                    {b.status === 'REJECTED' && 'ĐÃ TỪ CHỐI'}
                    {b.status === 'CANCELLED' && 'KHÁCH ĐÃ HỦY'}
                    {b.status === 'COMPLETED' && 'HOÀN THÀNH'}
                  </span>
                  {b.reminderSent && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      📧 Đã nhắc lịch
                    </span>
                  )}
                  <h3 className="text-base sm:text-lg font-bold text-white w-full sm:w-auto">
                    {b.portfolioItem
                      ? `Mẫu Portfolio: ${b.portfolioItem.title}`
                      : b.customRequest
                      ? `Ý tưởng Custom: ${b.customRequest.placement} (${b.customRequest.size})`
                      : 'Đặt lịch xăm hình'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2 text-xs sm:text-sm text-neutral-300">
                  <div className="bg-neutral-900/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                    <span className="text-neutral-500 block text-xs">Khách hàng & SĐT:</span>
                    <strong className="text-white">{b.customer?.name}</strong> —{' '}
                    <span className="text-emerald-400 font-semibold">{b.customer?.phone || b.customer?.email}</span>
                  </div>
                  <div className="bg-neutral-900/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                    <span className="text-neutral-500 block text-xs">Khung giờ hẹn:</span>
                    <strong className="text-white">{new Date(b.startTime).toLocaleString('vi-VN')}</strong> (
                    {b.durationMin || 90} phút)
                  </div>
                  <div className="bg-neutral-900/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                    <span className="text-neutral-500 block text-xs">Chi phí & Tiền cọc:</span>
                    <strong className="text-amber-400">
                      {(b.totalPrice || b.quote?.totalPrice || 0).toLocaleString('vi-VN')} ₫
                    </strong>{' '}
                    (Cọc: {(b.depositAmount || b.quote?.depositAmount || 0).toLocaleString('vi-VN')} ₫)
                  </div>
                </div>

                {b.note && (
                  <p className="text-xs text-neutral-300 bg-neutral-900/70 p-3 rounded-xl border border-neutral-800">
                    <strong>Ghi chú của khách:</strong> {b.note}
                  </p>
                )}

                {b.rejectReason && (
                  <p className="text-xs text-red-300 bg-red-500/10 p-3 rounded-xl border border-red-500/30">
                    <strong>Lý do từ chối:</strong> {b.rejectReason}
                  </p>
                )}
              </div>

              {/* Approve / Reject / Reminder Actions */}
              <div className="flex flex-col justify-center gap-2 w-full lg:w-64 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                {b.status === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      disabled={submitting}
                      onClick={() => handleApproveBooking(b.id)}
                      className="w-full py-3 lg:py-2.5 px-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors text-xs sm:text-sm"
                    >
                      ✓ Chấp Nhận (Approve)
                    </button>
                    {rejectingBookingId === b.id ? (
                      <div className="space-y-2 p-3 bg-neutral-900 rounded-xl border border-red-500/40">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Nhập lý do từ chối..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRejectBooking(b.id)}
                            className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700"
                          >
                            Xác Nhận Từ Chối
                          </button>
                          <button
                            onClick={() => setRejectingBookingId(null)}
                            className="px-3 py-2 bg-neutral-800 text-neutral-400 text-xs rounded-lg"
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setRejectingBookingId(b.id);
                          setRejectReason('');
                        }}
                        className="w-full py-3 lg:py-2.5 px-4 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/20 transition-colors text-xs sm:text-sm"
                      >
                        ✕ Từ Chối (Reject)
                      </button>
                    )}
                  </>
                )}

                {b.status !== 'REJECTED' && b.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={runningReminder}
                    onClick={() => handleTriggerReminderJob(b.id)}
                    className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-300 font-semibold rounded-xl transition-colors text-xs"
                  >
                    📧 Gửi Mail Nhắc Lịch (HTML)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CUSTOM REQUEST QUOTING */}
      {activeTab === 'CUSTOM_REQUESTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {customRequests.map((req) => {
            const images: string[] = JSON.parse(req.imagesJson || '[]');
            return (
              <div
                key={req.id}
                className="glass-dark p-4 sm:p-6 rounded-2xl border border-neutral-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                    <div>
                      <span className="text-xs text-neutral-400">
                        Khách hàng: <strong className="text-white">{req.client?.name}</strong> (
                        <span className="text-emerald-400">{req.client?.phone}</span>)
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                        Vị trí: {req.placement} — Kích thước: {req.size}
                      </h3>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold self-start whitespace-nowrap ${
                        req.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {req.status === 'PENDING' ? 'Chờ Báo Giá' : `Đã Báo Giá (${req.status})`}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-300 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 mb-4">
                    {req.description}
                  </p>

                  {images.length > 0 && (
                    <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 mb-4">
                      {images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="Client Idea"
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-neutral-700 shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  {req.quotedPrice && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1 mb-4">
                      <div className="text-emerald-300 font-bold">Báo giá đã gửi cho khách:</div>
                      <div>
                        Giá tiền: <strong className="text-amber-400">{req.quotedPrice.toLocaleString('vi-VN')} ₫</strong>{' '}
                        | Thời gian: <strong>{req.estimatedDuration} phút</strong>
                      </div>
                      {req.adminNote && <div>Ghi chú: {req.adminNote}</div>}
                    </div>
                  )}
                </div>

                {/* Quote Input Form for Admin */}
                {quotingId === req.id ? (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-900 border border-amber-500/40 space-y-3">
                    <h4 className="font-bold text-xs sm:text-sm text-amber-300">Nhập Báo Giá & Thời Gian Thực Hiện</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">Giá tiền báo khách (VNĐ)</label>
                        <input
                          type="number"
                          value={quotedPrice}
                          onChange={(e) => setQuotedPrice(e.target.value)}
                          placeholder="VD: 2500000"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">Thời gian ước tính (Phút)</label>
                        <input
                          type="number"
                          value={estimatedDuration}
                          onChange={(e) => setEstimatedDuration(e.target.value)}
                          placeholder="VD: 120"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Lời nhắn tư vấn cho khách</label>
                      <input
                        type="text"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="VD: Mẫu này đi nét mảnh tầm 2 tiếng là đẹp hoàn hảo nhé!"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={submitting}
                        onClick={() => handleSendQuote(req.id)}
                        className="flex-1 py-2.5 bg-amber-400 text-black font-bold rounded-xl text-xs hover:bg-amber-300"
                      >
                        Gửi Báo Giá Cho Khách
                      </button>
                      <button
                        onClick={() => setQuotingId(null)}
                        className="px-4 py-2.5 bg-neutral-800 text-neutral-400 rounded-xl text-xs"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setQuotingId(req.id);
                      setQuotedPrice(req.quotedPrice ? String(req.quotedPrice) : '2500000');
                      setEstimatedDuration(req.estimatedDuration ? String(req.estimatedDuration) : '120');
                      setAdminNote(req.adminNote || '');
                    }}
                    className="w-full py-3 bg-white text-black font-bold rounded-xl text-xs sm:text-sm hover:bg-neutral-200 transition-colors"
                  >
                    {req.status === 'PENDING' ? 'Nhập Báo Giá & Thời Gian Ước Tính' : 'Cập Nhật Lại Báo Giá'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: PORTFOLIO MANAGEMENT */}
      {activeTab === 'PORTFOLIO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="glass-dark p-4 sm:p-6 rounded-2xl border border-neutral-800 h-fit">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Đăng Bài / Hình Xăm Mẫu Mới</h3>
            <form onSubmit={handleCreatePortfolio} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Tên tác phẩm / Hình mẫu (*)</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Phượng Hoàng Fine Line"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Tải ảnh từ máy hoặc nhập URL (*)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePortfolioImageUpload}
                  className="w-full text-xs text-neutral-400 mb-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:text-white cursor-pointer"
                />
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Giá tiền dự kiến (VNĐ) (*)</label>
                  <input
                    type="number"
                    required
                    value={portfolioPrice}
                    onChange={(e) => setPortfolioPrice(e.target.value)}
                    placeholder="1500000"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-amber-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Thời gian ước tính (Phút) (*)</label>
                  <input
                    type="number"
                    required
                    value={portfolioDuration}
                    onChange={(e) => setPortfolioDuration(e.target.value)}
                    placeholder="120"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Phong cách (Style)</label>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Vị trí gợi ý</label>
                  <input
                    type="text"
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ý nghĩa hoặc kỹ thuật thực hiện..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors"
              >
                {submitting ? 'Đang đăng...' : '+ Đăng Lên Portfolio'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {portfolioItems.map((item) => (
              <div
                key={item.id}
                className="glass-dark rounded-2xl border border-neutral-800 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover bg-neutral-900" />
                  <div className="p-4">
                    <h4 className="font-bold text-white text-base">{item.title}</h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      {item.style} • Vị trí: {item.placement}
                    </p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-800 text-xs">
                      <span className="font-bold text-amber-400 text-sm">
                        {item.estimatedPrice.toLocaleString('vi-VN')} ₫
                      </span>
                      <span className="text-neutral-300 font-semibold">⏱ {item.estimatedDuration} phút</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleDeletePortfolio(item.id)}
                    className="w-full py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 rounded-xl text-xs transition-colors"
                  >
                    Xóa mẫu này
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-neutral-400">Đang tải hệ thống Quản trị Admin...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
