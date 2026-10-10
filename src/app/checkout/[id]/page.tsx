'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // In a real app, we would fetch the booking details here
  // For MVP mock, we just show a static checkout interface

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
        body: JSON.stringify({ bookingId: params.id })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/my-bookings');
        }, 2000);
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
      <div className="w-full max-w-lg mx-auto text-center mt-20 animate-fade-in">
        <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-5xl shadow-lg shadow-green-500/50">
          ✓
        </div>
        <h1 className="text-3xl font-bold mb-4">Thanh Toán Thành Công!</h1>
        <p className="text-neutral-400">Lịch hẹn của bạn đã được xác nhận. Đang chuyển hướng...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto mt-12 animate-slide-up">
      <div className="glass-dark p-8 rounded-3xl border border-neutral-800 shadow-2xl text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Thanh Toán Đặt Cọc</h1>
        <p className="text-neutral-400 mb-8">Vui lòng hoàn tất thanh toán để xác nhận lịch hẹn (ID: {params.id.slice(0,8)})</p>

        <div className="bg-white p-6 rounded-2xl mb-8 flex justify-center">
          {/* Mock QR Code */}
          <div className="w-48 h-48 bg-neutral-100 border-4 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 font-bold">
            MOCK QR CODE
          </div>
        </div>

        <div className="flex justify-between items-center text-lg mb-8 p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
          <span className="text-neutral-400">Số tiền cọc:</span>
          <span className="font-bold text-emerald-400 text-2xl">300,000 ₫</span>
        </div>

        <button 
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Đang xác nhận...' : 'Giả Lập Đã Chuyển Khoản'}
        </button>
      </div>
    </div>
  );
}
