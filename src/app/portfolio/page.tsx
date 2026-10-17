'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} phút`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} giờ ${mins}p (${minutes}p)` : `${hrs} giờ (${minutes}p)`;
}

export default function PortfolioPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-7xl animate-slide-up">
      <div className="text-center mb-8 sm:mb-12 px-1">
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4">Portfolio Hình Xăm Mẫu</h1>
        <p className="text-xs sm:text-sm md:text-base text-neutral-400 max-w-2xl mx-auto mb-5 leading-relaxed">
          Chọn trực tiếp mẫu hình xăm có sẵn với giá niêm yết & thời gian thực hiện rõ ràng, hoặc gửi ý tưởng riêng của bạn để được Artist báo giá.
        </p>
        {role === 'ADMIN' ? (
          <Link
            href="/dashboard/admin?tab=PORTFOLIO"
            className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3.5 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-500 transition-all text-xs sm:text-sm shadow-lg"
          >
            + Đăng Bài / Thêm Hình Xăm Mẫu Mới (Admin)
          </Link>
        ) : (
          <Link
            href="/custom-request"
            className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-3.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold rounded-2xl sm:rounded-full hover:bg-amber-500/30 transition-all text-xs sm:text-sm"
          >
            ✨ Chưa thấy mẫu ưng ý? Gửi Ý Tưởng Xăm Riêng ngay!
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-neutral-400 animate-pulse text-sm">
          Đang tải bộ sưu tập Portfolio...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-2xl glass-dark border border-neutral-800 hover:border-neutral-600 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="relative w-full h-60 sm:h-72 overflow-hidden bg-neutral-900">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                  />
                  {item.isFlash && (
                    <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[11px] px-2.5 py-1 rounded-full font-bold shadow-lg">
                      Mẫu Có Sẵn
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur-md text-amber-400 border border-amber-500/30 text-xs sm:text-sm px-3 py-1.5 rounded-xl font-bold shadow">
                    {item.estimatedPrice.toLocaleString('vi-VN')} ₫
                  </div>
                </div>

                <div className="p-4 sm:p-6 pb-2">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">{item.title}</h3>
                    <span className="text-[11px] px-2.5 py-1 bg-neutral-800 text-neutral-300 rounded-lg whitespace-nowrap shrink-0">
                      {item.style || 'Tattoo'}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-neutral-400 mb-4 line-clamp-2">{item.description}</p>
                  )}

                  <div className="space-y-2 text-xs text-neutral-300 bg-neutral-900/70 p-3 sm:p-3.5 rounded-xl border border-neutral-800 mb-4">
                    <div className="flex justify-between gap-2">
                      <span className="text-neutral-500">Thời gian dự kiến:</span>
                      <span className="font-semibold text-white text-right">⏱ {formatDuration(item.estimatedDuration)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-neutral-500">Vị trí gợi ý:</span>
                      <span className="text-white text-right">{item.placement || 'Tùy chọn'}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-neutral-500">Thực hiện bởi:</span>
                      <span className="text-white text-right">{item.artist?.name || 'Hiển Artist'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 pt-0">
                {role === 'ADMIN' ? (
                  <Link
                    href="/dashboard/admin?tab=PORTFOLIO"
                    className="block w-full text-center py-3.5 bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold rounded-xl hover:bg-purple-600/30 transition-colors text-sm"
                  >
                    Quản Lý Mẫu Này (Admin)
                  </Link>
                ) : (
                  <Link
                    href={`/booking?portfolioId=${item.id}`}
                    className="block w-full text-center py-3.5 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors text-sm"
                  >
                    Chọn Mẫu Này & Đặt Lịch
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
