'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/my-bookings');
        }, 1500);
      } else {
        alert('Lỗi xử lý thanh toán!');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-full max-w-lg mx-auto text-center mt-10 sm:mt-20 px-4 animate-fade-in">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-4xl sm:text-5xl shadow-lg shadow-emerald-500/50">
          ✓
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Thanh Toán Cọc Thành Công!</h1>
        <p className="text-neutral-400 text-sm">Lịch hẹn của bạn đã chuyển sang trạng thái Đã Xác Nhận. Đang chuyển hướng...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto mt-6 sm:mt-12 animate-slide-up">
      <div className="glass-dark p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-neutral-800 shadow-2xl text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Thanh Toán Đặt Cọc</h1>
        <p className="text-neutral-400 mb-6 sm:mb-8 text-xs sm:text-sm">
          Hoàn tất chuyển khoản cọc cho đơn đặt lịch #{id.slice(0, 8)}
        </p>

        <div className="bg-white p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 flex justify-center">
          <div className="w-44 h-44 sm:w-48 sm:h-48 bg-neutral-100 border-4 border-dashed border-neutral-300 flex items-center justify-center text-neutral-500 font-bold text-xs sm:text-sm">
            VIETQR - HIỂN TATTOO
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-3.5 sm:py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
        >
          {loading ? 'Đang xác nhận...' : 'Giả Lập Đã Chuyển Khoản Cọc'}
        </button>
      </div>
    </div>
  );
}
