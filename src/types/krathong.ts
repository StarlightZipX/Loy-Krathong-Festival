export type KrathongStyleId =
  | 'banana-leaf'
  | 'lotus'
  | 'coconut'
  | 'bread'
  | 'royal-gold';

export interface KrathongStyleMeta {
  id: KrathongStyleId;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  badgeBg: string;
}

export const KRATHONG_STYLES: KrathongStyleMeta[] = [
  {
    id: 'banana-leaf',
    name: 'กระทงใบตองคลาสสิก',
    description: 'กลีบใบตองพับประณีต ประดับดอกดาวเรือง',
    primaryColor: '#2e8b57',
    accentColor: '#fbbf24',
    badgeBg: 'from-emerald-600 to-amber-500',
  },
  {
    id: 'lotus',
    name: 'กระทงดอกบัวหลวง',
    description: 'กลีบบัวชมพูซ้อนชั้น สวยงามอ่อนช้อย',
    primaryColor: '#ec4899',
    accentColor: '#fde047',
    badgeBg: 'from-pink-500 to-rose-400',
  },
  {
    id: 'coconut',
    name: 'กระทงกะลาประทีป',
    description: 'กะลามะพร้าวแกะสลัก พร้อมประทีปส่องสว่าง',
    primaryColor: '#78350f',
    accentColor: '#f59e0b',
    badgeBg: 'from-amber-800 to-orange-500',
  },
  {
    id: 'bread',
    name: 'กระทงขนมปังสีรุ้ง',
    description: 'เป็นมิตรต่อปลา สีสันสดใสน่ารัก',
    primaryColor: '#38bdf8',
    accentColor: '#f472b6',
    badgeBg: 'from-sky-400 to-pink-400',
  },
  {
    id: 'royal-gold',
    name: 'กระทงกลีบทองวิจิตร',
    description: 'กลีบทองคำเปลวและดอกไม้ม่วงมงคล',
    primaryColor: '#eab308',
    accentColor: '#a855f7',
    badgeBg: 'from-yellow-500 to-purple-600',
  },
];

export const KRATHONG_STYLE_MAP: Record<KrathongStyleId, KrathongStyleMeta> =
  Object.fromEntries(KRATHONG_STYLES.map((s) => [s.id, s])) as Record<
    KrathongStyleId,
    KrathongStyleMeta
  >;

export interface KrathongEntry {
  id: string;
  name: string;
  wish: string;
  style: KrathongStyleId;
  primaryColor: string;
  accentColor: string;
  photoUrl: string;
  votes: number;
  position: {
    x: number;
    z: number;
  };
  createdAt: string;
  isUserCreated?: boolean;
}

export type CameraPresetId = 'overview' | 'river' | 'temple';
