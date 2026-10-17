'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSendEmailOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ Email hợp lệ để nhận mã OTP!');
      return;
    }
    setSendingOtp(true);
    setError('');
    setOtpSentMessage('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          name: name.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Không thể gửi mã OTP qua Email.');
      } else {
        setOtpSentMessage(data.message);
        if (data.devOtp) {
          setOtp(data.devOtp);
        }
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ khi gửi mã OTP!');
    }
    setSendingOtp(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      phone: phone.trim(),
      password: password.trim(),
      redirect: false,
    });

    if (res?.ok) {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData?.user?.role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else {
        router.push('/');
      }
      router.refresh();
    } else {
      setError('Số điện thoại / Email hoặc mật khẩu không chính xác!');
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
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          otp: otp.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Đăng ký thất bại');
        setLoading(false);
        return;
      }

      const loginRes = await signIn('credentials', {
        phone: phone.trim(),
        password: password.trim(),
        redirect: false,
      });

      if (loginRes?.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ!');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-2 sm:mt-8 px-0 sm:px-2 animate-slide-up">
      <div className="glass-dark p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-neutral-800 shadow-2xl w-full">
        {/* Mode Switcher */}
        <div className="flex bg-neutral-900 p-1 rounded-xl sm:rounded-2xl mb-5 border border-neutral-800">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError('');
              setOtpSentMessage('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all ${
              mode === 'LOGIN' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError('');
              setOtpSentMessage('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all ${
              mode === 'REGISTER' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Đăng Ký Mới
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1.5 text-center">
          {mode === 'LOGIN' ? 'Chào Mừng Trở Lại' : 'Tạo Tài Khoản Khách Hàng'}
        </h1>
        <p className="text-neutral-400 text-center mb-6 text-xs leading-relaxed">
          {mode === 'LOGIN'
            ? 'Đăng nhập bằng Số điện thoại (hoặc Email) & Mật khẩu'
            : 'Nhập thông tin & xác thực mã OTP gửi qua Email (SMTP)'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={mode === 'LOGIN' ? handleLogin : handleRegister} className="flex flex-col space-y-4">
          {mode === 'REGISTER' && (
            <div className="w-full">
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Họ và Tên (*)</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-white transition-colors"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}

          <div className="w-full">
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              {mode === 'LOGIN' ? 'Số Điện Thoại hoặc Email (*)' : 'Số Điện Thoại (*)'}
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-white transition-colors"
              placeholder={mode === 'LOGIN' ? 'Nhập SĐT hoặc Email của bạn' : 'VD: 0901234567'}
            />
          </div>

          {mode === 'REGISTER' && (
            <>
              {/* Mandatory Email + Send SMTP OTP Button */}
              <div className="w-full">
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Địa Chỉ Email Nhận Mã OTP (*)
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-white transition-colors"
                    placeholder="example@gmail.com"
                  />
                  <button
                    type="button"
                    disabled={sendingOtp}
                    onClick={handleSendEmailOtp}
                    className="w-full sm:w-auto px-4 py-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl whitespace-nowrap transition-colors disabled:opacity-50"
                  >
                    {sendingOtp ? 'Đang gửi...' : 'Gửi OTP Qua Email'}
                  </button>
                </div>
                {otpSentMessage && (
                  <p className="text-xs text-emerald-400 mt-2 leading-relaxed bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                    ✓ {otpSentMessage}
                  </p>
                )}
              </div>

              {/* 6-digit OTP Verification Input */}
              <div className="w-full">
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Mã Xác Thực OTP (6 số nhận qua Email) (*)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 text-emerald-400 font-mono tracking-widest text-sm font-bold focus:outline-none focus:border-white transition-colors"
                  placeholder="Nhập 6 chữ số OTP"
                />
              </div>
            </>
          )}

          <div className="w-full">
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              {mode === 'LOGIN' ? 'Mật Khẩu (*)' : 'Tạo Mật Khẩu Đăng Nhập (*)'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-white transition-colors"
              placeholder={mode === 'LOGIN' ? 'Nhập mật khẩu của bạn' : 'Nhập mật khẩu cho tài khoản'}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phone || (mode === 'REGISTER' && (!email || !otp))}
            className="w-full py-4 mt-2 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50 text-sm sm:text-base shadow-lg"
          >
            {loading
              ? 'Đang xử lý...'
              : mode === 'LOGIN'
              ? 'Đăng Nhập Ngay'
              : 'Xác Thực OTP & Hoàn Tất Đăng Ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
