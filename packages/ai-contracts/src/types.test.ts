import { describe, expect, it } from 'vitest';
import type { AgentAction, ChatEvent } from './types';

describe('AI contracts', () => {
  it('preserves discriminants when serialized', () => {
    const event: ChatEvent = { type: 'cards', cards: [] };
    const action: AgentAction = { type: 'create_draft', draftId: 'draft-1', requiresConfirmation: true };

    expect(JSON.parse(JSON.stringify(event))).toEqual({ type: 'cards', cards: [] });
    expect(JSON.parse(JSON.stringify(action))).toEqual({
      type: 'create_draft',
      draftId: 'draft-1',
      requiresConfirmation: true,
    });
  });
});

