import { Camera, Compass, Flame, Landmark, Sparkles, Trophy, Waves } from 'lucide-react';
import type { CameraPresetId } from '../types/krathong';

interface HudOverlayProps {
  krathongCount: number;
  totalVotes: number;
  syncMode: 'connecting' | 'firestore' | 'local';
  onOpenCreate: () => void;
  onOpenLeaderboard: () => void;
  onSelectPreset: (preset: CameraPresetId) => void;
}

export function HudOverlay({
  krathongCount,
  totalVotes,
  syncMode,
  onOpenCreate,
  onOpenLeaderboard,
  onSelectPreset,
}: HudOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Bar */}
      <header className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="pointer-events-auto rounded-2xl border border-amber-400/30 bg-slate-950/65 backdrop-blur-md px-3.5 py-2.5 shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-amber-100 leading-tight">
                ลอยกระทงออนไลน์ 3D
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-300">
                โหวตผู้เข้าประกวดกลางแสงจันทร์
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 text-[11px] sm:text-xs text-slate-200 border-t border-slate-800/80 pt-1.5">
            <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
              <Waves className="h-3.5 w-3.5" />
              {krathongCount} กระทง
            </span>
            <span className="inline-flex items-center gap-1 text-rose-300 font-medium">
              <Flame className="h-3.5 w-3.5" />
              {totalVotes} โหวต
            </span>
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                syncMode === 'firestore'
                  ? 'text-emerald-300'
                  : syncMode === 'local'
                  ? 'text-amber-300'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  syncMode === 'firestore'
                    ? 'bg-emerald-400 animate-pulse'
                    : syncMode === 'local'
                    ? 'bg-amber-400'
                    : 'bg-slate-400'
                }`}
              />
              {syncMode === 'firestore'
                ? 'Firestore'
                : syncMode === 'local'
                ? 'Local'
                : 'กำลังเชื่อมต่อ'}
            </span>
          </div>
        </div>

        {/* Right Quick Controls */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="hidden md:flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-950/65 backdrop-blur-md p-1">
            <button
              type="button"
              onClick={() => onSelectPreset('overview')}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition cursor-pointer"
            >
              <Compass className="h-3.5 w-3.5" />
              ภาพรวม
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset('river')}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition cursor-pointer"
            >
              <Waves className="h-3.5 w-3.5" />
              ริมแม่น้ำ
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset('temple')}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition cursor-pointer"
            >
              <Landmark className="h-3.5 w-3.5" />
              วัดและเจดีย์
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSelectPreset('overview')}
            className="md:hidden flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-950/70 backdrop-blur-md px-3 py-2 text-xs font-medium text-slate-200 hover:border-amber-400/50 transition cursor-pointer"
            aria-label="รีเซ็ตมุมกล้อง"
          >
            <Compass className="h-4 w-4 text-amber-300" />
            <span>มุมหลัก</span>
          </button>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-slate-950/70 hover:bg-slate-900 backdrop-blur-md px-3 py-2 text-xs sm:text-sm font-medium text-amber-200 shadow-lg transition cursor-pointer"
          >
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>อันดับโหวต</span>
          </button>
        </div>
      </header>

      {/* Bottom Action Bar */}
      <footer className="flex flex-col items-center gap-2 pb-1">
        <button
          type="button"
          onClick={onOpenCreate}
          className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 hover:brightness-110 active:scale-95 px-5 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-xl shadow-amber-500/30 ring-2 ring-amber-200/50 transition cursor-pointer"
        >
          <Camera className="h-5 w-5" />
          <span>ถ่ายรูป & ลอยกระทงประกวด</span>
        </button>

        <div className="rounded-full border border-slate-700/60 bg-slate-950/60 backdrop-blur-sm px-3.5 py-1 text-[11px] sm:text-xs text-slate-300 text-center">
          ลากเพื่อหมุน • เลื่อน/จีบนิ้วเพื่อซูม • แตะกระทงในน้ำเพื่อดูข้อมูลและโหวต
        </div>
      </footer>
    </div>
  );
}
