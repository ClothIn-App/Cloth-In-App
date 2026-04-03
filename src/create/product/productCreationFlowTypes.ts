/**
 * Product creation cross-flow contract (Phase 1 — product similarity prep).
 *
 * **Where context is set**
 * - FitPic: `fitpic_post` passes route params when opening add-product (`sourceFlow`, `draftSessionId`, `resumeRoute`).
 * - Standalone: `CreateActionBubbles` passes `sourceFlow` + `resumeRoute`; `draftSessionId` comes from
 *   `CreateModalsSessionProvider` in `app/create-modals/_layout.tsx` (one id per mount of the create-modals stack).
 *
 * **Where it is consumed**
 * - `app/create-modals/addproduct.tsx` reads params + session, loads/saves form draft, sets `resolvedProductOutcome`
 *   on success or cancel, and calls `usePost().addProduct` for FitPic success (same path later for “matched” id).
 *
 * **Serialization**
 * - `ProductCreationReturnContext` fields that matter across navigation are mirrored in Expo Router search params
 *   for add-product (`sourceFlow`, `draftSessionId`, `resumeRoute`, legacy `returnTo`).
 * - Partial product form + confirmation flags persist in AsyncStorage via `productFormDraftStorage` keyed by
 *   `sourceFlow` + `draftSessionId`. Photo/caption FitPic state stays in `DraftsContext` / `PostContext` only.
 */

export type ProductCreationSourceFlow = 'fitpic' | 'standalone';

/** Opaque id for one create-modals session (FitPic chain or standalone add-product entry). */
export type DraftSessionId = string;

export type ResumePresentation = {
  /** Logical stack name for future nested sheets. */
  stack: 'create-modals';
};

export type ResumeDestination = {
  /** Expo Router path to return to after add-product (documentation + future deep links). */
  resumeRoute: string;
  presentation?: ResumePresentation;
};

/**
 * Outcome once the user finishes or abandons product creation / future match resolution.
 * Phase 1 uses `pending`, `created`, `cancelled`. `matched` is reserved for Phase 3.
 */
export type ResolvedProductOutcome =
  | { kind: 'pending' }
  | { kind: 'created'; productId: string }
  | { kind: 'matched'; productId: string }
  | { kind: 'cancelled' };

export type ProductCreationReturnContext = {
  sourceFlow: ProductCreationSourceFlow;
  draftSessionId: DraftSessionId;
  resume: ResumeDestination;
  resolvedProductOutcome: ResolvedProductOutcome;
};

export const DEFAULT_RESUME_FOR_FITPIC: ResumeDestination = {
  resumeRoute: '/create-modals/fitpic_post',
  presentation: { stack: 'create-modals' },
};

export const DEFAULT_RESUME_FOR_STANDALONE: ResumeDestination = {
  resumeRoute: '/(tabs)',
  presentation: { stack: 'create-modals' },
};

export function parseSourceFlow(value: string | undefined): ProductCreationSourceFlow | null {
  if (value === 'fitpic' || value === 'standalone') return value;
  return null;
}
