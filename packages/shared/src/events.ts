export type PlatformEventName =
  | 'search_submitted'
  | 'search_zero_result'
  | 'draft_created'
  | 'post_published'
  | 'response_received'
  | 'post_completed'
  | 'digest_opened';

export interface PlatformEvent<TPayload = Record<string, unknown>> {
  eventName: PlatformEventName;
  actorId: string | null;
  payload: TPayload;
  createdAt: string;
}

