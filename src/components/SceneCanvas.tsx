import { useEffect, useRef } from 'react';
import type { CameraPresetId, KrathongEntry } from '../types/krathong';
import { LoyKrathongScene } from '../three/LoyKrathongScene';

interface SceneCanvasProps {
  krathongs: KrathongEntry[];
  selectedId: string | null;
  focusRequest: { id: string; nonce: number } | null;
  presetRequest: { preset: CameraPresetId; nonce: number } | null;
  onSelectKrathong: (id: string) => void;
}

export function SceneCanvas({
  krathongs,
  selectedId,
  focusRequest,
  presetRequest,
  onSelectKrathong,
}: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<LoyKrathongScene | null>(null);
  const onSelectRef = useRef(onSelectKrathong);
  onSelectRef.current = onSelectKrathong;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scene = new LoyKrathongScene(el, (id) => {
      onSelectRef.current(id);
    });
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.syncKrathongs(krathongs);
  }, [krathongs]);

  useEffect(() => {
    sceneRef.current?.setSelectedKrathong(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (focusRequest) {
      sceneRef.current?.focusKrathong(focusRequest.id);
    }
  }, [focusRequest]);

  useEffect(() => {
    if (presetRequest) {
      sceneRef.current?.setCameraPreset(presetRequest.preset);
    }
  }, [presetRequest]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full overflow-hidden"
      aria-label="ฉาก 3D งานลอยกระทง"
    />
  );
}
