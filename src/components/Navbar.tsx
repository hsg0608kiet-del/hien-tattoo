'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = (session?.user as any)?.role;
  const phone = (session?.user as any)?.phone;

  // Tự động đóng Drawer khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Khóa cuộn nền khi mở Mobile Drawer
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 w-full z-50 glass-dark h-16 md:h-20 px-4 sm:px-6 md:px-12 flex justify-between items-center border-b border-neutral-800/80">
        {/* Brand Logo */}
        <Link
          href={role === 'ADMIN' ? '/dashboard/admin' : '/'}
          className="font-bold text-lg sm:text-xl tracking-tighter cursor-pointer flex items-center gap-2 shrink-0"
        >
          <span>
            HIỂN<span className="text-neutral-400">TATTOO</span>
          </span>
          {role === 'ADMIN' && (
            <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full uppercase tracking-wider">
              Admin
            </span>
          )}
        </Link>

        {/* DESKTOP NAVIGATION (Hidden on Mobile < md) */}
        <div className="hidden md:flex gap-6 lg:gap-8 items-center text-sm font-medium text-neutral-300">
          <Link href="/" className="hover:text-white transition-colors">
            Trang chủ
          </Link>
          <Link href="/portfolio" className="hover:text-white transition-colors">
            Portfolio Hình Mẫu
          </Link>

          {role === 'ADMIN' ? (
            <>
              <Link
                href="/dashboard/admin?tab=BOOKINGS"
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
              >
                Duyệt Đặt Lịch
              </Link>
              <Link
                href="/dashboard/admin?tab=CUSTOM_REQUESTS"
                className="text-amber-400 hover:text-amber-300 transition-colors font-semibold"
              >
                Báo Giá Custom
              </Link>
            </>
          ) : (
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
                <Link
                  href="/my-bookings"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
                >
                  Lịch & Yêu Cầu Của Tôi
                </Link>
              )}
              {role === 'ADMIN' && (
                <Link
                  href="/dashboard/admin"
                  className="px-3.5 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors font-bold shadow"
                >
                  Quản Trị Studio
                </Link>
              )}
              <span className="hidden xl:inline text-xs text-neutral-400">
                {session.user?.name} {phone ? `(${phone})` : ''}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-neutral-400 hover:text-red-400 transition-colors text-xs underline cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 px-4 py-2 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors"
            >
              Đăng nhập / Đăng ký
            </Link>
          )}
        </div>

        {/* MOBILE HAMBURGER BUTTON (Visible only on Mobile < md) */}
        <button
          type="button"
          aria-label="Mở menu điều hướng"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 focus:outline-none transition-colors"
        >
          {mobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* MOBILE NAVIGATION DRAWER / SHEET */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
          />

          {/* Slide-out Sheet on the Right */}
          <div className="fixed top-16 right-0 bottom-0 w-4/5 max-w-xs bg-neutral-950 border-l border-neutral-800 p-5 flex flex-col justify-between overflow-y-auto shadow-2xl z-50">
            <div className="space-y-6">
              {/* User Info Card */}
              {session ? (
                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                  <div className="text-xs text-neutral-400 mb-1">Đang đăng nhập:</div>
                  <div className="font-bold text-white text-sm truncate">{session.user?.name}</div>
                  {phone && <div className="text-xs text-emerald-400 font-mono mt-0.5">{phone}</div>}
                  <div className="mt-2 inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-200 font-semibold">
                    Role: {role}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400">
                  Đăng nhập bằng Số điện thoại để đặt lịch hoặc gửi ý tưởng xăm riêng.
                </div>
              )}

              {/* Navigation Links */}
              <div className="flex flex-col space-y-2 text-sm font-medium">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-white transition-colors"
                >
                  🏠 Trang chủ
                </Link>
                <Link
                  href="/portfolio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-white transition-colors"
                >
                  🎨 Portfolio Hình Mẫu
                </Link>

                {role === 'ADMIN' ? (
                  <>
                    <Link
                      href="/dashboard/admin?tab=BOOKINGS"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold"
                    >
                      ✅ Duyệt Danh Sách Đặt Lịch
                    </Link>
                    <Link
                      href="/dashboard/admin?tab=CUSTOM_REQUESTS"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold"
                    >
                      💰 Báo Giá Ý Tưởng Custom
                    </Link>
                    <Link
                      href="/dashboard/admin?tab=PORTFOLIO"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 font-bold"
                    >
                      ⚙️ Bảng Quản Trị Studio
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/custom-request"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold"
                    >
                      ✨ Gửi Ý Tưởng Riêng (Custom)
                    </Link>
                    <Link
                      href="/booking"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-white transition-colors"
                    >
                      📅 Đặt Lịch Xăm
                    </Link>
                    {session && (
                      <Link
                        href="/my-bookings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold"
                      >
                        📋 Lịch & Yêu Cầu Của Tôi
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Bottom Auth Action */}
            <div className="pt-6 border-t border-neutral-800 mt-6">
              {session ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="w-full py-3.5 bg-red-500/15 border border-red-500/30 text-red-400 font-bold rounded-xl hover:bg-red-500/25 transition-colors text-sm"
                >
                  Đăng Xuất Tài Khoản
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3.5 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors text-sm"
                >
                  Đăng Nhập / Đăng Ký
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
