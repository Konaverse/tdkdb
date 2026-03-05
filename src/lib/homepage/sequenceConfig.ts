export const SEQUENCE_CONFIG = {
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
