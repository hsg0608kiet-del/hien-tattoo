'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'ADMIN'>('CLIENT');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSendOtp = () => {
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại trước khi nhận mã OTP!');
      return;
    }
    setError('');
    setOtpSent(true);
    setPassword('123456');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      phone: phone.trim(),
      password: password || '123456',
      redirect: false,
    });

    if (res?.ok) {
      // Fetch session to check role and redirect ADMIN directly to Admin Dashboard
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData?.user?.role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else {
        router.push('/');
      }
      router.refresh();
    } else {
      setError('Số điện thoại chưa được đăng ký hoặc mật khẩu/OTP không đúng!');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          password: password || '123456',
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Đăng ký thất bại');
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const loginRes = await signIn('credentials', {
        phone: phone.trim(),
        password: password || '123456',
        redirect: false,
      });

      if (loginRes?.ok) {
        router.push(role === 'ADMIN' ? '/dashboard/admin' : '/');
        router.refresh();
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ!');
    }
    setLoading(false);
  };

  const quickFill = (demoPhone: string, demoPass: string) => {
    setMode('LOGIN');
    setPhone(demoPhone);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 animate-slide-up">
      <div className="glass-dark p-8 rounded-3xl border border-neutral-800 shadow-2xl">
        {/* Mode Switcher */}
        <div className="flex bg-neutral-900 p-1 rounded-2xl mb-6 border border-neutral-800">
          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              mode === 'LOGIN' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => { setMode('REGISTER'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              mode === 'REGISTER' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Đăng Ký Mới
          </button>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          {mode === 'LOGIN' ? 'Chào Mừng Trở Lại' : 'Tạo Tài Khoản Mới'}
        </h1>
        <p className="text-neutral-400 text-center mb-6 text-xs">
          Xác thực nhanh chóng bằng Số điện thoại & Mật khẩu / Mã OTP
        </p>

        {/* Demo Quick Access Box */}
        <div className="mb-6 p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-xs">
          <div className="text-neutral-400 mb-2 font-medium">Tài khoản có sẵn để test nhanh (Click để điền):</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickFill('0901234567', '123')}
              className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-left transition-colors"
            >
              <div className="font-bold">Role CLIENT</div>
              <div>SĐT: 0901234567</div>
            </button>
            <button
              type="button"
              onClick={() => quickFill('0988888888', '123')}
              className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-left transition-colors"
            >
              <div className="font-bold">Role ADMIN</div>
              <div>SĐT: 0988888888</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={mode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Họ và Tên</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Số Điện Thoại (*)</label>
            <div className="flex gap-2">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors"
                placeholder="0901234567"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 rounded-xl border border-neutral-700 whitespace-nowrap transition-colors"
              >
                Gửi OTP
              </button>
            </div>
            {otpSent && (
              <p className="text-[11px] text-emerald-400 mt-1">
                ✓ Đã gửi mã OTP giả lập: <strong>123456</strong> (Đã tự động điền)
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Mật Khẩu hoặc Mã OTP (*)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors"
              placeholder="Nhập mật khẩu hoặc mã OTP (123456)"
            />
          </div>

          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Loại Tài Khoản (Phân Quyền)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('CLIENT')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    role === 'CLIENT'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Khách Hàng (CLIENT)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    role === 'ADMIN'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Chủ Studio (ADMIN)
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full py-3.5 mt-2 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50"
          >
            {loading
              ? 'Đang xử lý...'
              : mode === 'LOGIN'
              ? 'Đăng Nhập Ngay'
              : 'Hoàn Tất Đăng Ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
