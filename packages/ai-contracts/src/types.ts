import type { PostCard, PostDraft } from '@xiangliji/domain';

export type AgentMode = 'town_search' | 'general_qa' | 'current_qa' | 'draft_creation';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatInput {
  sessionId: string;
  userId: string | null;
  townCode: string;
  message: string;
  mode?: AgentMode;
  history: ChatTurn[];
}

export interface IntentInput {
  message: string;
  townCode: string;
}

export interface IntentResult {
  mode: AgentMode;
  confidence: number;
  needsWebSearch: boolean;
}

export interface ExtractInput {
  text: string;
  category?: string;
  townCode?: string;
}

export interface AudioInput {
  audioUrl: string;
}

export interface Transcript {
  text: string;
  confidence: number;
}

export interface SearchInput {
  query: string;
  townCode?: string;
  limit?: number;
}

export interface SearchResult {
  card: PostCard;
  score: number;
}

export interface ModerationInput {
  text?: string;
  imageUrl?: string;
}

export interface ModerationResult {
  action: 'pass' | 'review' | 'reject';
  reasons: string[];
}

export type AnswerSource =
  | { type: 'platform'; postId: string; title: string }
  | { type: 'web'; title: string; url: string }
  | { type: 'model'; label: 'general_knowledge' };

export type AgentAction =
  | { type: 'open_post'; postId: string; requiresConfirmation: false }
  | { type: 'create_draft'; draftId: string; requiresConfirmation: true }
  | { type: 'create_subscription'; query: string; requiresConfirmation: true };

export type ChatEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'cards'; cards: PostCard[] }
  | { type: 'sources'; sources: AnswerSource[] }
  | { type: 'action'; action: AgentAction }
  | { type: 'warning'; code: string; message: string }
  | { type: 'error'; code: string; message: string }
  | { type: 'done'; runId: string };

export type { PostCard, PostDraft };

