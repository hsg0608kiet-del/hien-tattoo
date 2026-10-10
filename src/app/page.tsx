import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl text-center animate-slide-up">
      <div className="mb-4 inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-sm text-neutral-300">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
        Hệ thống đặt lịch đang mở
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
        Nghệ Thuật Khắc Ghi <br /> Dấu Ấn Của Bạn
      </h1>
      
      <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
        Khám phá phong cách độc bản, trải nghiệm dịch vụ xăm hình chuyên nghiệp và đặt lịch trực tuyến dễ dàng tại Hiển Tattoo Studio.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Link href="/booking" className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95">
          Đặt Lịch Ngay
        </Link>
        <Link href="/portfolio" className="px-8 py-4 bg-neutral-900 border border-neutral-800 text-white font-medium rounded-full hover:bg-neutral-800 transition-all hover:scale-105 active:scale-95">
          Khám Phá Portfolio
        </Link>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        {[
          { title: 'Tư Vấn Miễn Phí', desc: 'Trò chuyện 1-1 với Artist để lên ý tưởng hoàn hảo nhất.' },
          { title: 'Thiết Kế Độc Quyền', desc: 'Mỗi hình xăm là một tác phẩm được vẽ tay riêng biệt.' },
          { title: 'Chất Lượng Hàng Đầu', desc: 'Sử dụng mực và dụng cụ chuẩn y tế, an toàn tuyệt đối.' },
        ].map((feature, i) => (
          <div key={i} className="glass-dark p-6 rounded-2xl border border-neutral-800/50 hover:border-neutral-700 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
