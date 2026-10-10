import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ArtistProfilePage({ params }: { params: { id: string } }) {
  const artist = await prisma.user.findUnique({
    where: { id: params.id, role: 'ARTIST' },
    include: {
      portfolioItems: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!artist) {
    notFound();
  }

  return (
    <div className="w-full max-w-5xl animate-slide-up">
      <div className="glass-dark p-8 md:p-12 rounded-3xl mb-12 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left border border-neutral-800">
        <div className="w-32 h-32 bg-neutral-800 rounded-full flex-shrink-0 flex items-center justify-center text-4xl font-bold border-4 border-neutral-700">
          {artist.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold">{artist.name}</h1>
            <span className="px-3 py-1 bg-white/10 text-white rounded-full text-sm font-medium border border-white/20">
              Senior Artist
            </span>
          </div>
          <p className="text-neutral-400 mb-8 max-w-2xl leading-relaxed">
            Chuyên gia về các thể loại Asian Traditional và Black & Grey. Với hơn 5 năm kinh nghiệm, 
            tôi luôn đặt cái tâm vào từng đường nét để mang lại tác phẩm hoàn hảo nhất cho khách hàng.
          </p>
          <div className="flex gap-4 justify-center md:justify-start">
            <Link href="/booking" className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
              Đặt Lịch Với Tôi
            </Link>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
        Tác Phẩm Tiêu Biểu
        <span className="text-sm font-normal text-neutral-500 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
          {artist.portfolioItems.length} tác phẩm
        </span>
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {artist.portfolioItems.map((item) => (
          <div key={item.id} className="group relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="relative w-full h-64 overflow-hidden">
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white mb-1 truncate">{item.title}</h3>
              <p className="text-xs text-neutral-400">{item.style} • {item.placement}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
