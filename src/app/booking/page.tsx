'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function BookingWizard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [slots, setSlots] = useState<{startTime: string, endTime: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Protected route
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (status === 'loading') {
    return <div className="text-center py-20 animate-pulse text-neutral-500">Đang kiểm tra phiên đăng nhập...</div>;
  }

  const fetchSlots = async (selectedDate: string) => {
    setLoading(true);
    try {
      const artistId = 'artist-1';
      const res = await fetch(`/api/bookings/slots?artistId=${artistId}&date=${selectedDate}`);
      const data = await res.json();
      if (data.slots) {
        setSlots(data.slots);
      }
    } catch (error) {
      console.error('Failed to fetch slots', error);
    }
    setLoading(false);
  };

  const handleHoldSlot = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: (session?.user as any)?.id,
          artistId: 'artist-1',
          serviceType: service,
          totalPrice: 1000000,
          depositAmount: 300000,
          durationMin: 60,
          startTime: slot,
          endTime: new Date(new Date(slot).getTime() + 60 * 60000).toISOString()
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/checkout/${data.booking.id}`);
      } else {
        alert('Có lỗi xảy ra, slot có thể đã được đặt!');
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // Removed bookingSuccess rendering block since we redirect immediately

  return (
    <div className="w-full max-w-3xl mx-auto glass-dark p-8 md:p-12 rounded-3xl animate-slide-up border border-neutral-800 shadow-2xl">
      <div className="text-center mb-8">
        <p className="text-neutral-400 text-sm">Đang đặt lịch với tư cách: <span className="text-white font-medium">{session?.user?.email}</span></p>
      </div>
      
      {/* Progress */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-800 -z-10 rounded-full transform -translate-y-1/2"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
            step >= i ? 'bg-white text-black border-white' : 'bg-neutral-900 text-neutral-500 border-neutral-700'
          }`}>
            {i}
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-8">
        {step === 1 && 'Chọn Dịch Vụ'}
        {step === 2 && 'Chọn Lịch Hẹn'}
        {step === 3 && 'Xác Nhận & Thanh Toán'}
      </h2>

      {/* Step 1: Service */}
      {step === 1 && (
        <div className="space-y-4">
          {['CONSULTATION', 'DESIGN', 'TATTOO'].map((srv) => (
            <label key={srv} className={`block p-6 rounded-2xl border cursor-pointer transition-all ${
              service === srv ? 'border-white bg-white/10 shadow-lg' : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/30'
            }`}>
              <input type="radio" name="service" value={srv} className="hidden" onChange={() => setService(srv)} />
              <div className="font-semibold text-lg">{
                srv === 'CONSULTATION' ? 'Tư Vấn Miễn Phí (30 phút)' :
                srv === 'DESIGN' ? 'Vẽ Thiết Kế Riêng' : 'Thực Hiện Xăm (Flash / Đã Duyệt)'
              }</div>
            </label>
          ))}
          <div className="flex justify-end mt-8">
            <button 
              disabled={!service}
              onClick={() => setStep(2)} 
              className="px-6 py-3 bg-white text-black rounded-full font-medium disabled:opacity-50 hover:bg-neutral-200 transition-all active:scale-95"
            >
              Tiếp Tục
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Date & Slot */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Chọn Ngày</label>
            <input 
              type="date" 
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setDate(e.target.value);
                setSlot('');
                fetchSlots(e.target.value);
              }}
            />
          </div>

          {date && (
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Giờ Khả Dụng</label>
              {loading ? (
                <div className="animate-pulse flex gap-2 flex-wrap">
                  {[1,2,3,4].map(i => <div key={i} className="w-24 h-12 bg-neutral-800 rounded-xl"></div>)}
                </div>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.map((s, i) => {
                    const timeString = new Date(s.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <button
                        key={i}
                        onClick={() => setSlot(s.startTime)}
                        className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                          slot === s.startTime ? 'bg-white text-black border-white shadow-lg' : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600'
                        }`}
                      >
                        {timeString}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-neutral-500 py-4">Không có lịch trống trong ngày này.</p>
              )}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(1)} className="px-6 py-3 text-neutral-400 hover:text-white transition-colors">Quay Lại</button>
            <button 
              disabled={!slot}
              onClick={() => setStep(3)} 
              className="px-6 py-3 bg-white text-black rounded-full font-medium disabled:opacity-50 hover:bg-neutral-200 transition-all active:scale-95"
            >
              Tiếp Tục
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Checkout */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
            <h3 className="font-semibold text-lg mb-4 text-white">Tóm Tắt Lịch Hẹn</h3>
            <div className="space-y-3 text-sm text-neutral-300">
              <div className="flex justify-between"><span className="text-neutral-500">Dịch vụ:</span> <span className="font-medium text-white">{service}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Thời gian:</span> <span className="font-medium text-white">{new Date(slot).toLocaleString('vi-VN')}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Khách hàng:</span> <span className="font-medium text-white">{session?.user?.name || session?.user?.email}</span></div>
              <div className="h-px w-full bg-neutral-800 my-4"></div>
              <div className="flex justify-between"><span className="text-neutral-500">Tổng giá tạm tính:</span> <span className="font-medium text-white">1,000,000đ</span></div>
              <div className="flex justify-between text-base"><span className="text-neutral-500">Cọc để giữ chỗ:</span> <span className="font-bold text-white">300,000đ</span></div>
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(2)} className="px-6 py-3 text-neutral-400 hover:text-white transition-colors">Quay Lại</button>
            <button 
              disabled={loading}
              onClick={handleHoldSlot} 
              className="px-8 py-3 bg-emerald-500 text-white rounded-full font-bold hover:bg-emerald-600 transition-all flex items-center shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] active:scale-95"
            >
              {loading ? 'Đang Xử Lý...' : 'Thanh Toán Cọc & Đặt Lịch'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
