export function setupVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  video.style.display = 'block';
  video.style.position = 'absolute';
  video.style.top = '0';
  video.style.left = '0';
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  video.style.zIndex = '-1';
  document.body.appendChild(video);
  return video;
}

export function setupCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'cover';
  canvas.style.zIndex = '0';
  document.body.appendChild(canvas);
  return canvas;
}

export function setupCanvasContext(canvas: HTMLCanvasElement, video: HTMLVideoElement): CanvasRenderingContext2D | null {
  // Match canvas internal resolution to video source
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  return canvas.getContext('2d');
}
