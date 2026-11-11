import { sampleFace, guideRect, photoRect } from '../vision/sampling.js';

const MAX_PHOTO_SIDE = 1280;

/** Sample the guide square of a live video frame. */
export function sampleVideoFrame(video) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  return sampleFace(imageData, guideRect(width, height));
}

/** Sample an uploaded photo (the photo is assumed to be cropped to one face). */
export async function sampleImageFile(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const imageData = ctx.getImageData(0, 0, width, height);
  return sampleFace(imageData, photoRect(width, height));
}

/** Map getUserMedia errors to messages the user can act on. */
export function describeCameraError(err) {
  const name = err?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera access was blocked. Allow camera permission for this site in your browser settings, or upload photos instead.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No usable camera was found. Connect a camera or upload photos instead.';
  }
  if (name === 'NotReadableError') {
    return 'The camera is in use by another application. Close it and try again, or upload photos instead.';
  }
  return 'The camera could not be started. You can upload photos instead.';
}
