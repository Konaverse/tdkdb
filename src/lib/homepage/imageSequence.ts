import type { SequenceConfig } from './sequenceConfig';

export function preloadSequence(
  config: SequenceConfig,
  onProgress: (pct: number) => void,
): Promise<HTMLImageElement[]> {
  const total = config.frameCount;
  const frames: HTMLImageElement[] = new Array(total);
  let loaded = 0;

  // Wait for the first N frames before allowing the canvas to 'assemble'
  const initialBatch = Math.min(30, total);
  const firstBatchPromises: Promise<void>[] = [];

  // Function to load a single image and asynchronously decode it off the main thread.
  // Using decode() prevents massive CPU spikes during GSAP requestAnimationFrame draws.
  const loadImage = (i: number): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      frames[i] = img;
      const url = config.path + String(i + 1).padStart(config.pad, '0') + config.extension;

      img.src = url;

      // Async off-thread decoding
      img
        .decode()
        .then(() => {
          loaded++;
          onProgress(loaded / total);
          resolve();
        })
        .catch(() => {
          // Fallback if browser cancels or doesn't support decode
          loaded++;
          onProgress(loaded / total);
          resolve();
        });
    });
  };

  // Load the first batch simultaneously to unblock the promise
  for (let i = 0; i < initialBatch; i++) {
    firstBatchPromises.push(loadImage(i));
  }

  return Promise.all(firstBatchPromises).then(async () => {
    // Fire off the rest sequentially so we don't saturate the browser's
    // concurrent connection limit (killing LCP for the rest of the page).
    // We don't await this; it continues populating frames in the background.
    const loadRemaining = async () => {
      for (let i = initialBatch; i < total; i++) {
        await loadImage(i);
      }
    };

    loadRemaining();
    return frames;
  });
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
