import { z } from 'zod';

import { CAMPAIGN_FIELDS } from './campaign-fields';

const touchSchema = z.object({
  landingPage: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
  capturedAt: z.string().datetime().optional(),
  ...Object.fromEntries(CAMPAIGN_FIELDS.map((field) => [field, z.string().max(500).optional()])),
});

export const attributionSchema = z
  .object({
    sourceUrl: z.string().max(2048).optional(),
    firstTouch: touchSchema.optional(),
    lastTouch: touchSchema.optional(),
  })
  .catch({});

export const submissionMetadataSchema = z.object({
  submissionId: z.string().uuid().optional(),
  attribution: attributionSchema.optional(),
});

export type Attribution = z.infer<typeof attributionSchema>;
export type AttributionTouch = NonNullable<Attribution['firstTouch']> &
  Partial<Record<(typeof CAMPAIGN_FIELDS)[number], string>>;
