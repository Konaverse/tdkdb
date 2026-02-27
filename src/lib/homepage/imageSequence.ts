import type { SequenceConfig } from './sequenceConfig';

export function preloadSequence(
  config: SequenceConfig,
  onProgress: (pct: number) => void,
): Promise<HTMLImageElement[]> {
  const total = config.frameCount;
  const frames: HTMLImageElement[] = new Array(total);
  let loaded = 0;

  const first30Promises: Promise<void>[] = [];

  for (let i = 0; i < total; i++) {
    const img = new Image();
    frames[i] = img;
    const url = config.path + String(i + 1).padStart(config.pad, '0') + config.extension;

    const loadPromise = new Promise<void>((resolve) => {
      img.onload = () => {
        loaded++;
        onProgress(loaded / total);
        resolve();
      };
      img.onerror = () => {
        loaded++;
        onProgress(loaded / total);
        resolve();
      };
    });

    img.src = url;

    if (i < 30) {
      first30Promises.push(loadPromise);
    }
  }

  return Promise.all(first30Promises).then(() => frames);
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  frames: HTMLImageElement[],
  index: number,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Walk backward from index to find the closest loaded frame
  let img: HTMLImageElement | null = null;
  for (let i = index; i >= 0; i--) {
    const f = frames[i];
    if (f && f.complete && f.naturalWidth > 0) {
      img = f;
      break;
    }
  }

  if (!img) return;

  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = ctx.canvas.width / ctx.canvas.height;

  let sx: number, sy: number, sw: number, sh: number;

  if (imgAspect > canvasAspect) {
    // Image wider → crop sides
    sh = img.naturalHeight;
    sw = sh * canvasAspect;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    // Image taller → crop top/bottom
    sw = img.naturalWidth;
    sh = sw / canvasAspect;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, ctx.canvas.width, ctx.canvas.height);
}
