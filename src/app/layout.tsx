import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hiển Tattoo Studio | Đặt Lịch Xăm Hình',
  description: 'Nền tảng đặt lịch xăm hình và tư vấn thiết kế chuyên nghiệp tại Hiển Tattoo Studio.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark overflow-x-hidden">
      <body className={`${inter.className} min-h-screen w-full max-w-full overflow-x-hidden bg-black text-white selection:bg-white selection:text-black flex flex-col`}>
        <Providers>
          <Navbar />

          {/* Main Content */}
          <main className="flex-1 pt-20 md:pt-28 pb-10 md:pb-16 px-4 sm:px-6 md:px-12 flex justify-center w-full max-w-full overflow-x-hidden">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
