export const SEQUENCE_CONFIG = {
  assembly: { frameCount: 40, fps: 24, pad: 4, path: '/sequences/assembly/frame-', extension: '.webp' },
  approach: { frameCount: 102, fps: 24, pad: 3, path: '/sequences/approach/frame-', extension: '.webp' },
} as const;

export type SequenceKey = keyof typeof SEQUENCE_CONFIG;
export type SequenceConfig = (typeof SEQUENCE_CONFIG)[SequenceKey];
