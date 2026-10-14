'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [placement, setPlacement] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (status === 'loading') {
    return <div className="text-center py-20 text-neutral-400">Đang tải...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="w-full max-w-xl mx-auto mt-16 text-center glass-dark p-10 rounded-3xl border border-neutral-800">
        <h2 className="text-2xl font-bold mb-3">Yêu Cầu Đăng Nhập</h2>
        <p className="text-neutral-400 mb-6 text-sm">
          Vui lòng đăng nhập bằng Số điện thoại để gửi ý tưởng hình xăm riêng và nhận thông báo báo giá từ Admin.
        </p>
        <Link href="/login" className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200">
          Đăng Nhập Ngay
        </Link>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError('Vui lòng tải lên ít nhất 1 hình ảnh tham khảo hoặc dán link ảnh ý tưởng!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          placement,
          size,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Có lỗi xảy ra');
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ!');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-xl mx-auto mt-16 text-center glass-dark p-10 rounded-3xl border border-neutral-800 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          ✓
        </div>
        <h2 className="text-3xl font-bold mb-3">Đã Gửi Ý Tưởng Thành Công!</h2>
        <p className="text-neutral-400 mb-8 text-sm leading-relaxed">
          Yêu cầu thiết kế hình xăm riêng của bạn đã được chuyển tới Admin/Artist. Sau khi Admin xem xét và gửi <strong>Báo giá tiền + Thời gian thực hiện ước tính</strong>, bạn sẽ thấy thông báo trong mục <strong>Lịch & Yêu Cầu Của Tôi</strong> để chấp nhận và đặt lịch.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/my-bookings" className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all">
            Xem Trạng Thái Yêu Cầu
          </Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setImages([]);
              setPlacement('');
              setSize('');
              setDescription('');
            }}
            className="px-6 py-3 bg-neutral-900 border border-neutral-700 text-white rounded-full hover:bg-neutral-800 transition-all"
          >
            Gửi Thêm Ý Tưởng Khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto glass-dark p-8 md:p-12 rounded-3xl border border-neutral-800 shadow-2xl animate-slide-up">
      <div className="mb-8">
        <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
          Custom Tattoo Request
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mt-3 mb-2">Gửi Ý Tưởng Xăm Riêng</h1>
        <p className="text-neutral-400 text-sm">
          Bạn có ý tưởng độc bản chưa có trên Portfolio? Hãy tải lên 1 hoặc nhiều ảnh tham khảo kèm mô tả vị trí và kích thước. Artist sẽ thẩm định và báo giá + thời gian thực hiện cho bạn.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Multiple Images */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            1. Tải lên 1 hoặc nhiều ảnh ý tưởng tham khảo (*)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-700 hover:border-white rounded-2xl cursor-pointer bg-neutral-900/40 transition-colors">
              <span className="text-2xl mb-1">📷</span>
              <span className="text-xs font-semibold text-white">Chọn file ảnh từ máy (Nhiều ảnh)</span>
              <span className="text-[11px] text-neutral-500 mt-1">Hỗ trợ PNG, JPG, WEBP</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="flex flex-col justify-center p-4 border border-neutral-800 rounded-2xl bg-neutral-900/40">
              <span className="text-xs text-neutral-400 mb-2">Hoặc dán link URL hình ảnh tham khảo:</span>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200"
                >
                  Thêm
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  setImages((prev) => [
                    ...prev,
                    'https://images.unsplash.com/photo-1590246814883-57c511a76917?w=800&q=80',
                  ])
                }
                className="mt-2 text-left text-[11px] text-amber-400 hover:underline"
              >
                + Chèn nhanh ảnh mẫu thử nghiệm
              </button>
            </div>
          </div>

          {/* Preview Images */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
              {images.map((img, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-neutral-700 h-28 bg-neutral-900">
                  <img src={img} alt={`Idea ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center opacity-90 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Placement & Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              2. Vị trí muốn xăm trên cơ thể (*)
            </label>
            <input
              type="text"
              required
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              placeholder="VD: Cẳng tay trong, Bả vai phải, Sống lưng..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              3. Kích thước mong muốn (cm) (*)
            </label>
            <input
              type="text"
              required
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="VD: 10cm x 15cm, hoặc Kín bắp tay..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
            />
          </div>
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            4. Mô tả chi tiết ý tưởng & Phong cách mong muốn (*)
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả rõ hơn về phong cách (nét mảnh, tả thực, trắng đen hay màu), ý nghĩa hoặc chi tiết bạn muốn thêm/bớt từ ảnh mẫu..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Đang gửi yêu cầu...' : 'Gửi Ý Tưởng Nhận Báo Giá'}
          </button>
        </div>
      </form>
    </div>
  );
}
