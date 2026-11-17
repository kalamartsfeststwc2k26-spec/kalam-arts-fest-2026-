export const STUDENT_PHOTO_SIZE = 640;
export const MAX_STUDENT_PHOTO_BYTES = 5 * 1024 * 1024;
export function studentPhotoGeometry(width, height, zoom = 1, x = 0, y = 0) {
  if (!(width > 0 && height > 0 && zoom >= 1 && zoom <= 3 && Math.abs(x) <= 100 && Math.abs(y) <= 100)) throw new Error('Invalid photo crop.');
  const scale = Math.max(STUDENT_PHOTO_SIZE / width, STUDENT_PHOTO_SIZE / height) * zoom;
  const w = width * scale, h = height * scale;
  return { width: w, height: h, left: (STUDENT_PHOTO_SIZE - w) * (x + 100) / 200, top: (STUDENT_PHOTO_SIZE - h) * (y + 100) / 200 };
}
export async function cropStudentPhoto(source, width, height, zoom, x, y, mimeType) {
  const image = new Image(); image.src = source; await image.decode();
  const rect = studentPhotoGeometry(width, height, zoom, x, y);
  const canvas = document.createElement('canvas'); canvas.width = STUDENT_PHOTO_SIZE; canvas.height = STUDENT_PHOTO_SIZE;
  const context = canvas.getContext('2d'); if (!context) throw new Error('Photo editing is not supported by this browser.');
  context.drawImage(image, rect.left, rect.top, rect.width, rect.height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, 0.9));
  if (!blob || blob.type !== mimeType || blob.size > MAX_STUDENT_PHOTO_BYTES) throw new Error('Could not process the photo within the size limit.');
  return blob;
}
