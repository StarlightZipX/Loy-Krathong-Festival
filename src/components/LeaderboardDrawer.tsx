import { useMemo, useState } from 'react';
import { Crown, Eye, Flame, Search, Sparkles, Trophy, X } from 'lucide-react';
import { KRATHONG_STYLE_MAP, type KrathongEntry } from '../types/krathong';

interface LeaderboardDrawerProps {
  isOpen: boolean;
  krathongs: KrathongEntry[];
  onClose: () => void;
  onFocusKrathong: (id: string) => void;
}

export function LeaderboardDrawer({
  isOpen,
  krathongs,
  onClose,
  onFocusKrathong,
}: LeaderboardDrawerProps) {
  const [query, setQuery] = useState('');
  const [onlyRealUsers, setOnlyRealUsers] = useState(false);

  const realUserCount = useMemo(
    () => krathongs.filter((k) => k.isUserCreated).length,
    [krathongs]
  );

  const ranked = useMemo(() => {
    let list = [...krathongs].sort((a, b) => b.votes - a.votes);
    if (onlyRealUsers) {
      list = list.filter((k) => k.isUserCreated);
    }
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter(
      (k) =>
        k.name.toLowerCase().includes(q) || k.wish.toLowerCase().includes(q)
    );
  }, [krathongs, query, onlyRealUsers]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-950/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-sm h-full bg-slate-900/95 border-l border-amber-400/25 text-slate-100 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-semibold text-amber-200">
              ผลโหวตผู้เข้าประกวด ({krathongs.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            aria-label="ปิดรายการอันดับ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3 border-b border-slate-800/80 space-y-2">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อหรือคำอธิษฐาน..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOnlyRealUsers(false)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition cursor-pointer ${
                !onlyRealUsers
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              ทั้งหมด ({krathongs.length})
            </button>
            <button
              type="button"
              onClick={() => setOnlyRealUsers(true)}
              className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition cursor-pointer ${
                onlyRealUsers
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              ผู้โพสต์จริง ({realUserCount})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollable-panel p-3 space-y-2">
          {ranked.map((item, idx) => {
            const styleMeta = KRATHONG_STYLE_MAP[item.style];
            return (
              <div
                key={item.id}
                onClick={() => {
                  onFocusKrathong(item.id);
                  onClose();
                }}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/65 hover:border-amber-400/50 hover:bg-slate-800/70 p-2.5 transition cursor-pointer"
              >
                <div className="w-6 text-center shrink-0 font-bold text-xs text-slate-400">
                  {idx === 0 ? (
                    <Crown className="h-4 w-4 text-amber-400 mx-auto" />
                  ) : (
                    `#${idx + 1}`
                  )}
                </div>

                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="h-11 w-11 rounded-lg object-cover border border-slate-700 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate">
                      {item.name}
                    </span>
                    {item.isUserCreated && (
                      <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-sky-500/20 border border-sky-400/35 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
                        <Sparkles className="h-2.5 w-2.5" />
                        จริง
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {styleMeta.name}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
                    <Flame className="h-3 w-3" />
                    {item.votes}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-sky-300">
                    <Eye className="h-3 w-3" />
                    ดู 3D
                  </span>
                </div>
              </div>
            );
          })}

          {ranked.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              ไม่พบกระทงที่ตรงกับคำค้นหา
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
