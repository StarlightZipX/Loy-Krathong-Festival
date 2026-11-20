import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  RefreshCw,
  Sparkles,
  SwitchCamera,
  X,
} from 'lucide-react';
import { KRATHONG_STYLES, type KrathongStyleId } from '../types/krathong';
import type { CreateKrathongPayload } from '../services/krathongApi';
import { compressImageToMaxSize } from '../utils/imageCompressor';

interface CreateKrathongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateKrathongPayload) => Promise<void>;
}

export function CreateKrathongModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateKrathongModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoSizeKb, setPhotoSizeKb] = useState<number>(0);
  const [name, setName] = useState('');
  const [wish, setWish] = useState('');
  const [style, setStyle] = useState<KrathongStyleId>('banana-leaf');
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string>('');
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('เบราว์เซอร์ไม่รองรับการเปิดกล้องโดยตรง กรุณาใช้ปุ่มเลือกรูปภาพแทน');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 960 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 30);
    } catch {
      setCameraError(
        'ไม่สามารถเข้าถึงกล้องได้ (อาจไม่ได้อนุญาตสิทธิ์หรือไม่มีกล้อง) คุณสามารถเลือกถ่าย/อัปโหลดรูปจากปุ่มด้านล่างได้'
      );
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setFormError('');
      setCameraError('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    setCompressing(true);
    setFormError('');
    try {
      const compressed = await compressImageToMaxSize(video);
      setPhotoUrl(compressed.dataUrl);
      setPhotoSizeKb(Number((compressed.sizeBytes / 1024).toFixed(1)));
      stopCamera();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'ไม่สามารถบีบอัดรูปภาพได้'
      );
    } finally {
      setCompressing(false);
    }
  };

  const handleFlipCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    void startCamera(next);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setCompressing(true);
    setFormError('');
    try {
      const compressed = await compressImageToMaxSize(file);
      setPhotoUrl(compressed.dataUrl);
      setPhotoSizeKb(Number((compressed.sizeBytes / 1024).toFixed(1)));
      stopCamera();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'ไม่สามารถลดขนาดรูปภาพได้'
      );
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      setFormError('กรุณาถ่ายรูปหรือแนบรูปตัวเองก่อนบันทึก');
      return;
    }
    if (!name.trim()) {
      setFormError('กรุณาป้อนชื่อของคุณ');
      return;
    }
    if (!wish.trim()) {
      setFormError('กรุณาป้อนคำอธิษฐาน');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({
        name: name.trim(),
        wish: wish.trim(),
        style,
        photoUrl,
      });
      setPhotoUrl('');
      setPhotoSizeKb(0);
      setName('');
      setWish('');
      setStyle('banana-leaf');
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto scrollable-panel rounded-2xl border border-amber-400/30 bg-slate-900/95 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-semibold text-amber-200">
              ถ่ายรูป & สร้างกระทงส่งประกวด
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Step 1: Photo Capture / Upload */}
          <div className="space-y-2.5">
            <label className="block text-sm font-medium text-amber-100">
              1. ถ่ายรูปตัวเองหรือแนบรูปภาพ <span className="text-rose-400">*</span>
            </label>

            <div className="rounded-xl border border-slate-700/80 bg-slate-950/70 p-3 flex flex-col items-center gap-3">
              {cameraActive ? (
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-xl overflow-hidden bg-black border border-amber-400/40">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      facingMode === 'user' ? '-scale-x-100' : ''
                    }`}
                  />
                </div>
              ) : photoUrl ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-xl overflow-hidden border-2 border-amber-400 shadow-lg">
                    <img
                      src={photoUrl}
                      alt="รูปผู้ส่งกระทง"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-medium text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      พร้อมแล้ว
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-300/90">
                    ขนาดรูปภาพ: {photoSizeKb} KB (ลดขนาดอัตโนมัติไม่เกิน 500 KB)
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                  <Camera className="h-10 w-10 mb-2 text-amber-400/80" />
                  <p className="text-xs sm:text-sm">
                    กดเปิดกล้องเพื่อถ่ายเซลฟี่ หรือเลือกรูปจากเครื่อง (ย่ออัตโนมัติ ≤ 500 KB)
                  </p>
                </div>
              )}

              {cameraError && (
                <p className="text-xs text-amber-300/90 text-center bg-amber-950/50 border border-amber-500/30 rounded-lg px-3 py-2">
                  {cameraError}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                {cameraActive ? (
                  <>
                    <button
                      type="button"
                      disabled={compressing}
                      onClick={() => void handleCapture()}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-slate-950 shadow transition cursor-pointer"
                    >
                      <Camera className="h-4 w-4" />
                      {compressing ? 'กำลังบีบอัด...' : 'กดถ่ายรูป'}
                    </button>
                    <button
                      type="button"
                      onClick={handleFlipCamera}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs sm:text-sm text-slate-200 transition cursor-pointer"
                    >
                      <SwitchCamera className="h-4 w-4" />
                      สลับกล้อง
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs sm:text-sm text-slate-300 transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={compressing}
                      onClick={() => void startCamera()}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500/90 hover:bg-amber-400 disabled:opacity-60 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-950 transition cursor-pointer"
                    >
                      {photoUrl ? (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          ถ่ายใหม่ด้วยกล้อง
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4" />
                          เปิดกล้องถ่ายรูป
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={compressing}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 px-3.5 py-2 text-xs sm:text-sm text-slate-100 transition cursor-pointer"
                    >
                      <ImagePlus className="h-4 w-4 text-sky-300" />
                      {compressing ? 'กำลังย่อขนาดรูป...' : 'เลือกรูป / กล้องมือถือ'}
                    </button>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => void handleFileChange(e)}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Name */}
          <div>
            <label
              htmlFor="krathong-name"
              className="block text-sm font-medium text-amber-100 mb-1.5"
            >
              2. ชื่อผู้ส่งกระทง <span className="text-rose-400">*</span>
            </label>
            <input
              id="krathong-name"
              type="text"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น น้องมินท์, ต้นกล้า..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Step 3: Wish */}
          <div>
            <label
              htmlFor="krathong-wish"
              className="block text-sm font-medium text-amber-100 mb-1.5"
            >
              3. คำอธิษฐาน <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="krathong-wish"
              rows={2}
              maxLength={200}
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              placeholder="ขอให้มีความสุข สุขภาพแข็งแรง สมหวังทุกประการ..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none resize-none"
            />
          </div>

          {/* Step 4: Krathong Style */}
          <div>
            <span className="block text-sm font-medium text-amber-100 mb-2">
              4. เลือกรูปแบบกระทง
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {KRATHONG_STYLES.map((item) => {
                const selected = style === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStyle(item.id)}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition cursor-pointer ${
                      selected
                        ? 'border-amber-400 bg-amber-500/15 shadow-sm'
                        : 'border-slate-700/80 bg-slate-950/60 hover:border-slate-500'
                    }`}
                  >
                    <span
                      className={`h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br ${item.badgeBg} ring-1 ring-white/20`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {formError && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 px-3.5 py-2 text-xs sm:text-sm text-rose-200">
              {formError}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="rounded-xl px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting || compressing}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              {submitting ? 'กำลังบันทึกลง Firestore...' : 'บันทึกและลอยกระทง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
