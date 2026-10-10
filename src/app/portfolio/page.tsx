import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

export default async function PortfolioPage() {
  const items = await prisma.portfolioItem.findMany({
    include: {
      artist: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="w-full max-w-7xl animate-slide-up">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Portfolio</h1>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Khám phá những tác phẩm nghệ thuật độc bản được thực hiện bởi các Artist tài năng tại Hiển Tattoo Studio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item) => (
          <div key={item.id} className="group relative overflow-hidden rounded-2xl glass-dark border border-neutral-800 hover:border-neutral-600 transition-colors">
            <div className="relative w-full h-80 overflow-hidden bg-neutral-900">
              {/* Using standard img for MVP simplicity with external URLs */}
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
              />
              {item.isFlash && (
                <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                  Mẫu Flash
                </div>
              )}
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <div className="flex justify-between items-center text-sm text-neutral-400 mb-6">
                <span>By <Link href={`/artist/${item.artistId}`} className="text-white hover:underline">{item.artist.name}</Link></span>
                <span>{item.placement}</span>
              </div>
              
              {item.isFlash ? (
                <Link href="/booking" className="block w-full text-center py-3 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-colors">
                  Đặt Mẫu Này
                </Link>
              ) : (
                <Link href="/booking" className="block w-full text-center py-3 bg-neutral-900 border border-neutral-700 text-white font-medium rounded-xl hover:bg-neutral-800 transition-colors">
                  Tư Vấn Thiết Kế Tương Tự
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
