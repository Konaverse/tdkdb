export const SEQUENCE_CONFIG = {
  assembly: {
    frameCount: 120,
    fps: 24,
    pad: 4,
    path: '/sequences/assembly/frame-',
    extension: '.webp',
  },
  approach: {
    frameCount: 152,
    fps: 24,
    pad: 3,
    path: '/sequences/approach/frame-',
    extension: '.webp',
  },
  armonia360: {
    frameCount: 65,
    fps: 20,
    pad: 4,
    path: '/sequences/armonia-360/frame-',
    extension: '.webp',
  },
} as const;

export type SequenceKey = keyof typeof SEQUENCE_CONFIG;
export type SequenceConfig = (typeof SEQUENCE_CONFIG)[SequenceKey];
