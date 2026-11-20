import { useState } from 'react';
import { Check, Flame, Heart, Sparkles, X } from 'lucide-react';
import { KRATHONG_STYLE_MAP, type KrathongEntry } from '../types/krathong';

interface KrathongDetailModalProps {
  krathong: KrathongEntry | null;
  hasVoted: boolean;
  onClose: () => void;
  onVote: (id: string) => Promise<void>;
}

export function KrathongDetailModal({
  krathong,
  hasVoted,
  onClose,
  onVote,
}: KrathongDetailModalProps) {
  const [voting, setVoting] = useState(false);
  const [justVoted, setJustVoted] = useState(false);

  if (!krathong) return null;

  const styleMeta = KRATHONG_STYLE_MAP[krathong.style];

  const handleVoteClick = async () => {
    if (hasVoted || voting) return;
    setVoting(true);
    try {
      await onVote(krathong.id);
      setJustVoted(true);
      setTimeout(() => setJustVoted(false), 1200);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-amber-400/35 bg-slate-900/95 text-slate-100 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Slim top gradient header */}
        <div
          className={`bg-gradient-to-r ${styleMeta.badgeBg} flex items-center justify-between px-4 py-2.5`}
        >
          <span className="text-xs sm:text-sm font-semibold text-white drop-shadow-sm">
            {styleMeta.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-950/35 p-1.5 text-white hover:bg-slate-950/65 transition cursor-pointer"
            aria-label="ปิดข้อมูลกระทง"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Owner Avatar & Info Header */}
          <div className="mb-4 flex items-center gap-4">
            <div className="h-24 w-24 rounded-2xl border-2 border-amber-400/50 bg-slate-800 overflow-hidden shadow-xl shrink-0">
              <img
                src={krathong.photoUrl}
                alt={krathong.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-white leading-snug">
                  {krathong.name}
                </h3>
                {krathong.isUserCreated && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                    <Sparkles className="h-3 w-3" />
                    ผู้เข้าประกวดใหม่
                  </span>
                )}
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-amber-300">
                <Flame className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold">{krathong.votes}</span>
                <span className="text-xs text-amber-200/80">โหวต</span>
              </div>
            </div>
          </div>

          {/* Wish & Vote */}
          <div className="space-y-3">

            <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                คำอธิษฐาน
              </p>
              <p className="text-sm leading-relaxed text-slate-100">
                “{krathong.wish}”
              </p>
            </div>

            {/* Vote Button */}
            <button
              type="button"
              disabled={hasVoted || voting}
              onClick={() => void handleVoteClick()}
              className={`mt-2 w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm sm:text-base font-semibold transition cursor-pointer ${
                hasVoted
                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 cursor-default'
                  : 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:brightness-110 text-white shadow-lg shadow-rose-500/25 active:scale-[0.99]'
              }`}
            >
              {hasVoted ? (
                <>
                  <Check className="h-5 w-5" />
                  {justVoted ? 'ขอบคุณสำหรับการโหวต!' : 'คุณโหวตกระทงนี้แล้ว'}
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5 fill-current" />
                  {voting ? 'กำลังบันทึกคะแนน...' : 'โหวตกระทงนี้ (+1)'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
