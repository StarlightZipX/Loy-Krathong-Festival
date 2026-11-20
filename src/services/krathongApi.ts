import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import seedData from '../../shared/seedKrathongs.json';
import {
  KRATHONG_STYLE_MAP,
  type KrathongEntry,
  type KrathongStyleId,
} from '../types/krathong';
import { createContestantAvatar } from '../utils/avatar';
import { MAX_IMAGE_SIZE_BYTES } from '../utils/imageCompressor';
import { db, isFirebaseConfigured } from './firebase';

const COLLECTION_NAME = 'krathongs';
const STORAGE_KEY_KRATHONGS = 'loy_krathong_entries_v1';
const STORAGE_KEY_VOTED = 'loy_krathong_voted_ids_v1';

function buildSeedEntries(): KrathongEntry[] {
  return seedData.map((raw, index) => ({
    id: raw.id,
    name: raw.name,
    wish: raw.wish,
    style: raw.style as KrathongStyleId,
    primaryColor: raw.primaryColor,
    accentColor: raw.accentColor,
    photoUrl: createContestantAvatar(
      raw.name,
      raw.primaryColor,
      raw.accentColor,
      index
    ),
    votes: raw.votes,
    position: raw.position,
    createdAt: raw.createdAt,
  }));
}

function readLocalKrathongs(): KrathongEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KRATHONGS);
    if (raw) {
      const parsed = JSON.parse(raw) as KrathongEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore corrupt local storage
  }
  const initial = buildSeedEntries();
  saveLocalKrathongs(initial);
  return initial;
}

function saveLocalKrathongs(list: KrathongEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_KRATHONGS, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

export function getVotedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOTED);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // Ignore
  }
  return new Set();
}

export function markVotedId(id: string): Set<string> {
  const current = getVotedIds();
  current.add(id);
  try {
    localStorage.setItem(STORAGE_KEY_VOTED, JSON.stringify(Array.from(current)));
  } catch {
    // Ignore
  }
  return current;
}

function pickRiverSpot(existing: KrathongEntry[]): { x: number; z: number } {
  const minDistSq = 3.6 * 3.6;
  for (let i = 0; i < 80; i += 1) {
    const x = Number(((Math.random() - 0.5) * 56).toFixed(2));
    const z = Number((-9.2 + Math.random() * 19.2).toFixed(2));
    if (Math.abs(x) < 5.2 && z < -8.2) continue;
    const close = existing.some((k) => {
      const dx = k.position.x - x;
      const dz = k.position.z - z;
      return dx * dx + dz * dz < minDistSq;
    });
    if (!close) return { x, z };
  }
  return {
    x: Number(((Math.random() - 0.5) * 52).toFixed(2)),
    z: Number((-3 + Math.random() * 13).toFixed(2)),
  };
}

let seedPromise: Promise<void> | null = null;

async function ensureFirestoreSeeded(): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const colRef = collection(firestore, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    if (!snap.empty) return;

    const batch = writeBatch(firestore);
    const initialList = buildSeedEntries();
    for (const item of initialList) {
      const docRef = doc(firestore, COLLECTION_NAME, item.id);
      batch.set(docRef, {
        name: item.name,
        wish: item.wish,
        style: item.style,
        primaryColor: item.primaryColor,
        accentColor: item.accentColor,
        photoUrl: item.photoUrl,
        votes: item.votes,
        position: item.position,
        createdAt: item.createdAt,
        isUserCreated: false,
      });
    }
    await batch.commit();
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });

  return seedPromise;
}

export function subscribeKrathongs(
  onData: (entries: KrathongEntry[]) => void,
  onStatus?: (info: { mode: 'firestore' | 'local'; error?: string }) => void
): Unsubscribe {
  const firestore = db;
  if (!isFirebaseConfigured || !firestore) {
    onData(readLocalKrathongs());
    onStatus?.({ mode: 'local', error: 'ยังไม่ได้ตั้งค่า Firebase config' });
    return () => {};
  }

  let unsub: Unsubscribe = () => {};
  let cancelled = false;

  void ensureFirestoreSeeded()
    .then(() => {
      if (cancelled) return;
      const q = query(collection(firestore, COLLECTION_NAME), orderBy('createdAt', 'asc'));
      unsub = onSnapshot(
        q,
        (snapshot) => {
          const list: KrathongEntry[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: String(data.name ?? ''),
              wish: String(data.wish ?? ''),
              style: (data.style as KrathongStyleId) || 'banana-leaf',
              primaryColor: String(data.primaryColor ?? '#16a34a'),
              accentColor: String(data.accentColor ?? '#fbbf24'),
              photoUrl: String(data.photoUrl ?? ''),
              votes: Number(data.votes ?? 0),
              position: {
                x: Number(data.position?.x ?? 0),
                z: Number(data.position?.z ?? 0),
              },
              createdAt: String(data.createdAt ?? new Date().toISOString()),
              isUserCreated: Boolean(data.isUserCreated),
            };
          });
          saveLocalKrathongs(list);
          onData(list);
          onStatus?.({ mode: 'firestore' });
        },
        (err) => {
          console.error('Firestore onSnapshot error:', err);
          onData(readLocalKrathongs());
          onStatus?.({
            mode: 'local',
            error: `ไม่สามารถเชื่อมต่อ Firestore (${err.code || err.message})`,
          });
        }
      );
    })
    .catch((err) => {
      console.error('Firestore init/seed error:', err);
      if (!cancelled) {
        onData(readLocalKrathongs());
        onStatus?.({
          mode: 'local',
          error: `เชื่อมต่อ Firestore ไม่สำเร็จ (${err?.code || err?.message || 'unknown'})`,
        });
      }
    });

  return () => {
    cancelled = true;
    unsub();
  };
}

export interface CreateKrathongPayload {
  name: string;
  wish: string;
  style: KrathongStyleId;
  primaryColor?: string;
  accentColor?: string;
  photoUrl: string;
}

export async function createKrathong(
  payload: CreateKrathongPayload,
  existingList: KrathongEntry[] = []
): Promise<KrathongEntry> {
  const cleanName = payload.name.trim().slice(0, 60);
  const cleanWish = payload.wish.trim().slice(0, 240);
  if (!cleanName || !cleanWish) {
    throw new Error('กรุณากรอกชื่อและคำอธิษฐานให้ครบถ้วน');
  }

  const photoByteLength = new Blob([payload.photoUrl]).size;
  if (photoByteLength > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('รูปภาพมีขนาดเกิน 500 KB กรุณาลดขนาดรูปอีกครั้ง');
  }

  const styleMeta = KRATHONG_STYLE_MAP[payload.style];
  const primaryColor = payload.primaryColor || styleMeta.primaryColor;
  const accentColor = payload.accentColor || styleMeta.accentColor;
  const position = pickRiverSpot(existingList);
  const createdAt = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    const docData = {
      name: cleanName,
      wish: cleanWish,
      style: payload.style,
      primaryColor,
      accentColor,
      photoUrl: payload.photoUrl,
      votes: 0,
      position,
      createdAt,
      isUserCreated: true,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    return {
      id: docRef.id,
      ...docData,
    };
  }

  const fallbackEntry: KrathongEntry = {
    id: `k-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    wish: cleanWish,
    style: payload.style,
    primaryColor,
    accentColor,
    photoUrl: payload.photoUrl,
    votes: 0,
    position,
    createdAt,
    isUserCreated: true,
  };
  const current = readLocalKrathongs();
  saveLocalKrathongs([...current, fallbackEntry]);
  return fallbackEntry;
}

export async function voteKrathong(
  id: string,
  fallbackEntry?: KrathongEntry
): Promise<void> {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, COLLECTION_NAME, id);
    try {
      await updateDoc(docRef, {
        votes: increment(1),
      });
      return;
    } catch (err) {
      // If document didn't exist in Firestore yet, upsert safely
      if (fallbackEntry) {
        await setDoc(
          docRef,
          {
            name: fallbackEntry.name,
            wish: fallbackEntry.wish,
            style: fallbackEntry.style,
            primaryColor: fallbackEntry.primaryColor,
            accentColor: fallbackEntry.accentColor,
            photoUrl: fallbackEntry.photoUrl,
            votes: fallbackEntry.votes + 1,
            position: fallbackEntry.position,
            createdAt: fallbackEntry.createdAt,
            isUserCreated: Boolean(fallbackEntry.isUserCreated),
          },
          { merge: true }
        );
        return;
      }
      throw err;
    }
  }

  const current = readLocalKrathongs();
  const next = current.map((item) =>
    item.id === id ? { ...item, votes: item.votes + 1 } : item
  );
  saveLocalKrathongs(next);
}
