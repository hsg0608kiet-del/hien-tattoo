'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full max-w-4xl text-center animate-slide-up px-1 sm:px-4">
      <div className="mb-4 inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-xs sm:text-sm text-neutral-300">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse shrink-0"></span>
        <span>{role === 'ADMIN' ? 'Chế độ Quản trị viên Studio (Admin)' : 'Hệ thống đặt lịch đang mở'}</span>
      </div>

      <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent leading-tight">
        Nghệ Thuật Khắc Ghi <br className="hidden sm:inline" /> Dấu Ấn Của Bạn
      </h1>

      <p className="text-sm sm:text-base md:text-xl text-neutral-400 max-w-2xl mb-8 sm:mb-10 leading-relaxed px-2">
        {role === 'ADMIN'
          ? 'Chào mừng Admin! Bạn có thể duyệt/từ chối danh sách đặt lịch của khách hàng, gửi báo giá cho ý tưởng xăm riêng và cập nhật kho Portfolio.'
          : 'Khám phá phong cách độc bản, trải nghiệm dịch vụ xăm hình chuyên nghiệp và đặt lịch trực tuyến dễ dàng tại Hiển Tattoo Studio.'}
      </p>

      {role === 'ADMIN' ? (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center">
          <Link
            href="/dashboard/admin?tab=BOOKINGS"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all text-sm sm:text-base"
          >
            Xem Danh Sách Đặt Lịch & Duyệt Đơn
          </Link>
          <Link
            href="/dashboard/admin?tab=CUSTOM_REQUESTS"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-amber-400 text-black font-bold rounded-full hover:bg-amber-300 transition-all text-sm sm:text-base"
          >
            Báo Giá Ý Tưởng Custom
          </Link>
          <Link
            href="/dashboard/admin?tab=PORTFOLIO"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-neutral-900 border border-neutral-800 text-white font-medium rounded-full hover:bg-neutral-800 transition-all text-sm sm:text-base"
          >
            Quản Lý Portfolio
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center">
          <Link
            href="/booking"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] text-sm sm:text-base"
          >
            Đặt Lịch Ngay
          </Link>
          <Link
            href="/custom-request"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold rounded-full hover:bg-amber-500/30 transition-all text-sm sm:text-base"
          >
            Gửi Ý Tưởng Xăm Riêng
          </Link>
          <Link
            href="/portfolio"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-neutral-900 border border-neutral-800 text-white font-medium rounded-full hover:bg-neutral-800 transition-all text-sm sm:text-base"
          >
            Khám Phá Portfolio
          </Link>
        </div>
      )}

      <div className="mt-12 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 w-full text-left">
        {[
          { title: 'Tư Vấn Miễn Phí', desc: 'Trò chuyện 1-1 với Artist để lên ý tưởng hoàn hảo nhất.' },
          { title: 'Thiết Kế Độc Quyền', desc: 'Mỗi hình xăm là một tác phẩm được vẽ tay riêng biệt.' },
          { title: 'Chất Lượng Hàng Đầu', desc: 'Sử dụng mực và dụng cụ chuẩn y tế, an toàn tuyệt đối.' },
        ].map((feature, i) => (
          <div
            key={i}
            className="glass-dark p-5 sm:p-6 rounded-2xl border border-neutral-800/50 hover:border-neutral-700 transition-colors"
          >
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5">{feature.title}</h3>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
