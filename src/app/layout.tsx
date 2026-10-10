import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hiển Tattoo Studio | Đặt Lịch Xăm Hình',
  description: 'Nền tảng đặt lịch xăm hình và tư vấn thiết kế chuyên nghiệp tại Hiển Tattoo Studio.',
};

import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col`}>
        <Providers>
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 pt-24 pb-12 px-4 md:px-12 flex justify-center w-full">
          {children}
        </main>
        </Providers>
      </body>
    </html>
  );
}
