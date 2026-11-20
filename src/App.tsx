import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreateKrathongModal } from './components/CreateKrathongModal';
import { HudOverlay } from './components/HudOverlay';
import { KrathongDetailModal } from './components/KrathongDetailModal';
import { LeaderboardDrawer } from './components/LeaderboardDrawer';
import { SceneCanvas } from './components/SceneCanvas';
import {
  createKrathong,
  getVotedIds,
  markVotedId,
  subscribeKrathongs,
  voteKrathong,
  type CreateKrathongPayload,
} from './services/krathongApi';
import type { CameraPresetId, KrathongEntry } from './types/krathong';

export function App() {
  const [krathongs, setKrathongs] = useState<KrathongEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(() => getVotedIds());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [syncMode, setSyncMode] = useState<'connecting' | 'firestore' | 'local'>('connecting');
  const [storageWarning, setStorageWarning] = useState<string>('');
  const [focusRequest, setFocusRequest] = useState<{
    id: string;
    nonce: number;
  } | null>(null);
  const [presetRequest, setPresetRequest] = useState<{
    preset: CameraPresetId;
    nonce: number;
  } | null>(null);
  const [toast, setToast] = useState<string>('');

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((prev) => (prev === message ? '' : prev));
    }, 3400);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeKrathongs(
      (list) => {
        setKrathongs(list);
      },
      (status) => {
        setSyncMode(status.mode);
        if (status.mode === 'local' && status.error) {
          setStorageWarning(status.error);
        } else {
          setStorageWarning('');
        }
      }
    );
    return unsubscribe;
  }, []);

  const selectedKrathong = useMemo(
    () => krathongs.find((k) => k.id === selectedId) ?? null,
    [krathongs, selectedId]
  );

  const totalVotes = useMemo(
    () => krathongs.reduce((sum, item) => sum + item.votes, 0),
    [krathongs]
  );

  const handleCreateKrathong = async (payload: CreateKrathongPayload) => {
    const created = await createKrathong(payload, krathongs);
    setKrathongs((prev) =>
      prev.some((item) => item.id === created.id) ? prev : [...prev, created]
    );
    setFocusRequest({ id: created.id, nonce: Date.now() });
    showToast(`ปล่อยกระทงของ "${created.name}" ลงแม่น้ำเรียบร้อย!`);
  };

  const handleVoteKrathong = async (id: string) => {
    const target = krathongs.find((k) => k.id === id);
    await voteKrathong(id, target);
    setVotedIds(markVotedId(id));
    if (target) {
      setKrathongs((prev) =>
        prev.map((k) => (k.id === id ? { ...k, votes: k.votes + 1 } : k))
      );
      showToast(`โหวตให้ "${target.name}" สำเร็จ!`);
    }
  };

  const handleFocusFromDrawer = (id: string) => {
    setFocusRequest({ id, nonce: Date.now() });
    setSelectedId(id);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <SceneCanvas
        krathongs={krathongs}
        selectedId={selectedId}
        focusRequest={focusRequest}
        presetRequest={presetRequest}
        onSelectKrathong={(id) => setSelectedId(id)}
      />

      <HudOverlay
        krathongCount={krathongs.length}
        totalVotes={totalVotes}
        syncMode={syncMode}
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onSelectPreset={(preset) =>
          setPresetRequest({ preset, nonce: Date.now() })
        }
      />

      <CreateKrathongModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateKrathong}
      />

      <KrathongDetailModal
        krathong={selectedKrathong}
        hasVoted={selectedKrathong ? votedIds.has(selectedKrathong.id) : false}
        onClose={() => setSelectedId(null)}
        onVote={handleVoteKrathong}
      />

      <LeaderboardDrawer
        isOpen={isLeaderboardOpen}
        krathongs={krathongs}
        onClose={() => setIsLeaderboardOpen(false)}
        onFocusKrathong={handleFocusFromDrawer}
      />

      {storageWarning && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 -translate-x-1/2 z-30 rounded-full border border-amber-500/40 bg-amber-950/90 px-3.5 py-1 text-[11px] text-amber-200 shadow-lg">
          โหมดสำรอง (Local): {storageWarning}
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-full border border-amber-400/50 bg-slate-900/95 px-4 py-2 text-xs sm:text-sm font-medium text-amber-200 shadow-2xl">
          {toast}
        </div>
      )}
    </main>
  );
}

export default App;
