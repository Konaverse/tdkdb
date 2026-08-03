import type { ComponentType } from 'react';

import type { Project } from '@/lib/sanity/types';

import AvailabilityPage from './pages/AvailabilityPage';
import CharacteristicsPage from './pages/CharacteristicsPage';
import ExteriorPage from './pages/ExteriorPage';
import FloorPlansPage from './pages/FloorPlansPage';
import InteriorPage from './pages/InteriorPage';
import OverviewPage from './pages/OverviewPage';

/* ───────────────────────────────────────────────────────────────────────────
   The six leaves of the brochure, in order. This array is the single source
   of truth for the modal: the nav bar, the arrow bounds, the keyboard range
   and the page stack are all derived from it, so adding or reordering a page
   is a one-line change here.
   ─────────────────────────────────────────────────────────────────────────── */

export interface ProjectModalPageProps {
  project: Project;
}

export interface ModalPage {
  /** Stable key — also the value the URL hash would carry if we ever add one. */
  id: string;
  /** Rendered verbatim in the nav bar. */
  label: string;
  Component: ComponentType<ProjectModalPageProps>;
}

export const MODAL_PAGES: ModalPage[] = [
  { id: 'overview', label: 'Overview', Component: OverviewPage },
  { id: 'characteristics', label: 'Characteristics', Component: CharacteristicsPage },
  { id: 'exterior', label: 'Exterior', Component: ExteriorPage },
  { id: 'interior', label: 'Interior', Component: InteriorPage },
  { id: 'floor-plans', label: 'Floor plans', Component: FloorPlansPage },
  { id: 'availability', label: 'Availability', Component: AvailabilityPage },
];

/** Shared inner padding. Each page owns its own composition inside this. */
export const PAGE_PAD = 'clamp(22px, 2.8vw, 54px)';
