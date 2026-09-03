export type PostStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'closed'
  | 'expired'
  | 'removed'
  | 'rejected';

export interface PostCard {
  id: string;
  category: string;
  title: string;
  townCode: string;
  townName: string;
  distanceKm: number | null;
  publishedAt: string;
  validUntil: string;
  summary: string;
  responseLabel: string | null;
}

export interface PostDraft {
  id: string;
  title: string;
  category: string | null;
  townCode: string | null;
  body: string;
  missingFields: string[];
  warnings: string[];
  status: 'draft';
}

