export const SEQUENCE_CONFIG = {
  assembly: { frameCount: 40, fps: 24, path: '/sequences/assembly/frame-', extension: '.webp' },
  approach: { frameCount: 52, fps: 24, path: '/sequences/approach/frame-', extension: '.webp' },
} as const;

export type SequenceKey = keyof typeof SEQUENCE_CONFIG;
export type SequenceConfig = (typeof SEQUENCE_CONFIG)[SequenceKey];
