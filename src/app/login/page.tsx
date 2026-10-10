'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await signIn('credentials', {
      email,
      password: 'any',
      redirect: false,
    });

    if (res?.ok) {
      router.push('/');
      router.refresh();
    } else {
      alert('Tài khoản không tồn tại trong hệ thống giả lập!');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-20 animate-slide-up">
      <div className="glass-dark p-8 rounded-3xl border border-neutral-800 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Đăng Nhập</h1>
        <p className="text-neutral-400 text-center mb-8 text-sm">
          Sử dụng email `customer1@example.com` hoặc `artist1@example.com` để thử nghiệm MVP.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
              placeholder="customer1@example.com"
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !email}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập Khám Phá'}
          </button>
        </form>
      </div>
    </div>
  );
}
