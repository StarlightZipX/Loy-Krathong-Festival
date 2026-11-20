export const MAX_IMAGE_SIZE_BYTES = 500 * 1024; // 500 KB

export interface CompressedImageResult {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

function getUtf8ByteLength(str: string): number {
  return new Blob([str]).size;
}

function loadImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการโหลดไฟล์รูปภาพ'));
    reader.readAsDataURL(file);
  });
}

/**
 * Resize and compress a captured camera frame or image file into a JPEG Data URL
 * strictly under maxBytes (default 500 KB) so it fits safely inside a Firestore document.
 */
export async function compressImageToMaxSize(
  input: HTMLVideoElement | HTMLImageElement | File | Blob,
  maxBytes: number = MAX_IMAGE_SIZE_BYTES
): Promise<CompressedImageResult> {
  const source: HTMLVideoElement | HTMLImageElement =
    input instanceof Blob ? await loadImageFromFile(input) : input;

  const naturalWidth =
    source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const naturalHeight =
    source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;

  if (!naturalWidth || !naturalHeight) {
    throw new Error('ไม่พบข้อมูลความละเอียดของรูปภาพ');
  }

  // Start with a crisp max dimension (720px) and shrink only if needed to meet <= 500 KB
  let maxDimension = 720;
  const qualitySteps = [0.88, 0.78, 0.68, 0.56, 0.45, 0.35, 0.25];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('ไม่สามารถสร้าง Canvas สำหรับย่อขนาดรูปภาพได้');
  }

  for (let pass = 0; pass < 5; pass += 1) {
    const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
    const targetWidth = Math.max(120, Math.round(naturalWidth * scale));
    const targetHeight = Math.max(120, Math.round(naturalHeight * scale));

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

    for (const quality of qualitySteps) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const sizeBytes = getUtf8ByteLength(dataUrl);
      if (sizeBytes <= maxBytes) {
        return {
          dataUrl,
          sizeBytes,
          width: targetWidth,
          height: targetHeight,
        };
      }
    }

    maxDimension = Math.round(maxDimension * 0.72);
  }

  throw new Error('ไม่สามารถลดขนาดรูปให้ต่ำกว่า 500 KB ได้ กรุณาเลือกรูปอื่น');
}
