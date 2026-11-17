export const COMMITTEE_PHOTO_SIZE = 640;
export const MAX_COMMITTEE_PHOTO_BYTES = 5 * 1024 * 1024;
export function committeePhotoGeometry(width, height, zoom = 1, x = 0, y = 0) {
  if (!(width > 0 && height > 0 && zoom >= 1 && zoom <= 3 && Math.abs(x) <= 100 && Math.abs(y) <= 100)) throw new Error('Invalid photo crop.');
  const scale = Math.max(COMMITTEE_PHOTO_SIZE / width, COMMITTEE_PHOTO_SIZE / height) * zoom;
  const w = width * scale, h = height * scale;
  return { width: w, height: h, left: (COMMITTEE_PHOTO_SIZE - w) * (x + 100) / 200, top: (COMMITTEE_PHOTO_SIZE - h) * (y + 100) / 200 };
}
export async function cropCommitteePhoto(source, width, height, zoom, x, y, mimeType) {
  const image = new Image(); image.src = source; await image.decode();
  const rect = committeePhotoGeometry(width, height, zoom, x, y);
  const canvas = document.createElement('canvas'); canvas.width = COMMITTEE_PHOTO_SIZE; canvas.height = COMMITTEE_PHOTO_SIZE;
  const context = canvas.getContext('2d'); if (!context) throw new Error('Photo editing is not supported by this browser.');
  context.drawImage(image, rect.left, rect.top, rect.width, rect.height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, 0.9));
  if (!blob || blob.type !== mimeType || blob.size > MAX_COMMITTEE_PHOTO_BYTES) throw new Error('Could not process the photo within the size limit.');
  return blob;
}
