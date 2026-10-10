'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <nav className="fixed w-full z-50 glass-dark py-4 px-6 md:px-12 flex justify-between items-center">
      <Link href="/" className="font-bold text-xl tracking-tighter cursor-pointer">
        HIỂN<span className="text-neutral-400">TATTOO</span>
      </Link>
      <div className="flex gap-6 items-center text-sm font-medium text-neutral-300">
        <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
        <Link href="/portfolio" className="hover:text-white transition-colors">Portfolio</Link>
        <Link href="/booking" className="hover:text-white transition-colors">Đặt lịch</Link>
        
        {session ? (
          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-neutral-700">
            {role === 'CUSTOMER' && <Link href="/my-bookings" className="text-emerald-400 hover:text-emerald-300 transition-colors">Lịch Của Tôi</Link>}
            {role === 'ARTIST' && <Link href="/dashboard/artist" className="text-blue-400 hover:text-blue-300 transition-colors">Artist Panel</Link>}
            {role === 'ADMIN' && <Link href="/dashboard/admin" className="text-purple-400 hover:text-purple-300 transition-colors">Admin Panel</Link>}
            
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-neutral-500 hover:text-red-400 transition-colors">Đăng xuất</button>
          </div>
        ) : (
          <Link href="/login" className="ml-4 px-4 py-2 bg-white text-black rounded-full hover:bg-neutral-200 transition-colors">
            Đăng nhập
          </Link>
        )}
      </div>
    </nav>
  );
}
