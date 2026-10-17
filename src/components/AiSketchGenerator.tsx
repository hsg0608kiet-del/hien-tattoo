'use client';

import { useState, useEffect } from 'react';

interface AiSketchGeneratorProps {
  onUseSketch: (imageUrl: string, promptText: string) => void;
}

const SAMPLE_PROMPTS = [
  {
    label: '☁️ Ký hiệu Akatsuki trong Naruto',
    value: 'Ký hiệu đám mây Akatsuki trong Naruto phong cách Stencil nét đậm',
  },
  {
    label: '🐉 Rồng mini quấn kiếm Nhật cổ',
    value: 'Rồng mini quấn kiếm katana phong cách Nhật cổ',
  },
  {
    label: '🪷 Hoa sen & Trăng lưỡi liềm Fine Line',
    value: 'Hoa sen nét mảnh kết hợp trăng lưỡi liềm',
  },
  {
    label: '🦊 Mặt nạ Hồ Ly Cyberpunk',
    value: 'Mặt nạ hồ ly Kitsune cơ khí phong cách Cyberpunk Blackwork',
  },
];

export default function AiSketchGenerator({ onUseSketch }: AiSketchGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [sketchUrl, setSketchUrl] = useState('');
  const [seed, setSeed] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [attachedSuccess, setAttachedSuccess] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Vui lòng nhập mô tả ý tưởng hình xăm của bạn trước khi tạo phác thảo!');
      return;
    }

    setLoading(true);
    setError('');
    setAttachedSuccess(false);

    try {
      const res = await fetch('/api/ai/generate-sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Có lỗi xảy ra khi gọi AI.');
        if (data.retryAfter) {
          setCooldown(Number(data.retryAfter));
        }
      } else {
        setSketchUrl(data.imageUrl);
        setSeed(data.seed);
        // Set a gentle 45s indicator or allow immediate view
      }
    } catch (err) {
      setError('Không thể kết nối tới dịch vụ AI. Vui lòng thử lại!');
    }
    setLoading(false);
  };

  const handleAttachToForm = () => {
    if (!sketchUrl) return;
    onUseSketch(sketchUrl, prompt.trim());
    setAttachedSuccess(true);
  };

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-purple-950/35 via-neutral-900/90 to-neutral-950 border border-purple-500/30 shadow-xl mb-6 sm:mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 mb-2">
            ✨ Pollinations.AI &bull; Flux Stencil Engine
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            TẠO PHÁC THẢO Ý TƯỞNG BẰNG AI
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
            Chưa có ảnh mẫu? Nhập mô tả ý tưởng để AI tự động vẽ bản phác thảo nét mộc (Tattoo Stencil) miễn phí 100%.
          </p>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Mô tả ý tưởng hình xăm của bạn:
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="Ví dụ: Ký hiệu đám mây Akatsuki trong Naruto, hoặc Rồng mini quấn kiếm phong cách Nhật cổ..."
            className="w-full bg-neutral-950/90 border border-neutral-800 focus:border-purple-400 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors disabled:opacity-60"
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {SAMPLE_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => {
                setPrompt(item.value);
                setError('');
              }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-left disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            ⏳ {error}
          </div>
        )}

        {/* Generate / Regenerate Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            disabled={loading || cooldown > 0}
            onClick={handleGenerate}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                <span>AI đang vẽ phác thảo (khoảng 6-10s)...</span>
              </>
            ) : cooldown > 0 ? (
              <span>⏳ Chờ {cooldown}s để tạo ảnh tiếp theo...</span>
            ) : sketchUrl ? (
              <span>🔄 Tạo lại phác thảo khác (Seed mới)</span>
            ) : (
              <span>✨ Tạo Phác Thảo AI</span>
            )}
          </button>
        </div>
      </div>

      {/* Result Preview Box */}
      {(sketchUrl || loading) && (
        <div className="mt-5 pt-5 border-t border-neutral-800/80 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-center">
            {/* Image Frame */}
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-white border-2 border-neutral-700 shadow-2xl flex items-center justify-center shrink-0">
              {loading && (
                <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-4 text-center z-10">
                  <div className="w-10 h-10 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-semibold text-purple-300">
                    Đang kết xuất nét vẽ Stencil (1024&times;1024)...
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Quá trình này mất khoảng 6 - 10 giây
                  </p>
                </div>
              )}

              {sketchUrl && (
                <img
                  src={sketchUrl}
                  alt="AI Tattoo Stencil Sketch"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Action & Info */}
            <div className="flex-1 w-full space-y-3 text-center md:text-left">
              <div className="inline-block px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 font-mono">
                Model: Pollinations Stencil &bull; 1024&times;1024 &bull; Seed: #{seed || '...'}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Bản Phác Thảo Nét Mộc (Flash Stencil)
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Nếu bạn ưng ý với bản phác thảo AI này, hãy bấm nút bên dưới để đính kèm trực tiếp vào hồ sơ gửi cho Artist báo giá &amp; chỉnh sửa chi tiết.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  disabled={loading || !sketchUrl}
                  onClick={handleAttachToForm}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs sm:text-sm transition-all shadow-lg disabled:opacity-50"
                >
                  ✓ Dùng ảnh này để gửi Báo giá Custom
                </button>
              </div>

              {attachedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
                  ✓ Đã đính kèm bản phác thảo AI vào mục <strong>Ảnh ý tưởng tham khảo</strong> bên dưới! Hãy điền Vị trí &amp; Kích thước để hoàn tất gửi Báo giá.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
