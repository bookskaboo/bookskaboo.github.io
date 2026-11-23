import type { ResearchListFilter } from './researchList';

/** Temporary UI return state, never campaign progression or persisted hint eligibility. */
export interface HintPanelContext {
  hintKey: string;
  filter: ResearchListFilter;
  query: string;
  showCompleted: boolean;
  selected?: string;
  scrollTop: number;
}
