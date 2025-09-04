export type PostDraftStatus = 'idle' | 'editing' | 'posting' | 'error';

export type PostDraft = {
  id: string;            // uuid
  photoIds: string[];    // ordered
  caption: string;
  productIds: string[];  // database ids (placeholder for now)
  status: PostDraftStatus;
  createdAt: number;
  updatedAt: number;
};
