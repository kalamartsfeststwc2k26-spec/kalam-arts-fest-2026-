export const BANNER_WIDTH = 1200;
export const BANNER_HEIGHT = 900;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export function cropGeometry(width, height, zoom = 1, x = 0, y = 0) {
  if (!(width > 0 && height > 0 && zoom >= 1 && zoom <= 3 && Math.abs(x) <= 100 && Math.abs(y) <= 100)) throw new Error('Invalid crop geometry');
  const scale = Math.max(BANNER_WIDTH / width, BANNER_HEIGHT / height) * zoom;
  const w = width * scale;
  const h = height * scale;
  return { width: w, height: h, left: (BANNER_WIDTH - w) * ((x + 100) / 200), top: (BANNER_HEIGHT - h) * ((y + 100) / 200) };
}
export async function cropBannerImage(source, width, height, zoom, x, y, mimeType) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const { width: w, height: h, left, top } = cropGeometry(width, height, zoom, x, y);
  const canvas = document.createElement('canvas');
  canvas.width = BANNER_WIDTH; canvas.height = BANNER_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image editing is not supported by this browser.');
  context.drawImage(image, left, top, w, h);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, 0.9));
  if (!blob || blob.type !== mimeType) throw new Error('Could not process the image. Please try another PNG or JPG.');
  if (blob.size > MAX_IMAGE_BYTES) throw new Error('The cropped image exceeds the 5 MiB limit. Try a smaller image.');
  return blob;
}
