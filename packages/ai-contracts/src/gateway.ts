import type {
  AudioInput,
  ChatEvent,
  ChatInput,
  ExtractInput,
  IntentInput,
  IntentResult,
  ModerationInput,
  ModerationResult,
  Transcript,
} from './types';
import type { PostDraft } from '@xiangliji/domain';

export interface AiGateway {
  classifyIntent(input: IntentInput): Promise<IntentResult>;
  chat(input: ChatInput): AsyncIterable<ChatEvent>;
  extractPostFields(input: ExtractInput): Promise<PostDraft>;
  transcribe(input: AudioInput): Promise<Transcript>;
  moderate(input: ModerationInput): Promise<ModerationResult>;
}

