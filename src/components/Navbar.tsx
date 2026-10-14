'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const phone = (session?.user as any)?.phone;

  return (
    <nav className="fixed w-full z-50 glass-dark py-4 px-6 md:px-12 flex justify-between items-center border-b border-neutral-800/80">
      <Link href={role === 'ADMIN' ? '/dashboard/admin' : '/'} className="font-bold text-xl tracking-tighter cursor-pointer flex items-center gap-2">
        <span>HIỂN<span className="text-neutral-400">TATTOO</span></span>
        {role === 'ADMIN' && (
          <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full uppercase tracking-wider">
            Admin
          </span>
        )}
      </Link>

      <div className="flex gap-5 md:gap-7 items-center text-sm font-medium text-neutral-300 flex-wrap">
        <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
        <Link href="/portfolio" className="hover:text-white transition-colors">Portfolio Hình Mẫu</Link>

        {/* Menu dành riêng cho Role ADMIN */}
        {role === 'ADMIN' ? (
          <>
            <Link href="/dashboard/admin?tab=BOOKINGS" className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold">
              Duyệt Danh Sách Đặt Lịch
            </Link>
            <Link href="/dashboard/admin?tab=CUSTOM_REQUESTS" className="text-amber-400 hover:text-amber-300 transition-colors font-semibold">
              Báo Giá Ý Tưởng Custom
            </Link>
          </>
        ) : (
          /* Menu dành cho Khách hàng (Role CLIENT) hoặc khách chưa đăng nhập */
          <>
            <Link href="/custom-request" className="text-amber-400 hover:text-amber-300 transition-colors">
              Gửi Ý Tưởng Riêng
            </Link>
            <Link href="/booking" className="hover:text-white transition-colors">
              Đặt lịch
            </Link>
          </>
        )}

        {session ? (
          <div className="flex items-center gap-4 ml-2 pl-4 border-l border-neutral-700">
            {(role === 'CLIENT' || role === 'CUSTOMER') && (
              <Link href="/my-bookings" className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold">
                Lịch & Yêu Cầu Của Tôi
              </Link>
            )}
            {role === 'ADMIN' && (
              <Link href="/dashboard/admin" className="px-3.5 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors font-bold shadow">
                Bảng Quản Trị Studio
              </Link>
            )}
            <span className="hidden lg:inline text-xs text-neutral-400">
              {session.user?.name} {phone ? `(${phone})` : ''}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-neutral-400 hover:text-red-400 transition-colors text-xs underline"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <Link href="/login" className="ml-2 px-4 py-2 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors">
            Đăng nhập / Đăng ký
          </Link>
        )}
      </div>
    </nav>
  );
}
