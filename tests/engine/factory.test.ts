import { describe, it, expect } from 'vitest';
import { createEngine } from '../../src/engine/factory.js';
import { ClaudeEngine } from '../../src/engine/claude-engine.js';

describe('Engine Factory', () => {
  it('should create Claude engine', () => {
    const engine = createEngine({ type: 'claude' });
    expect(engine).toBeInstanceOf(ClaudeEngine);
  });

  it('should pass timeout to Claude engine', () => {
    const engine = createEngine({ type: 'claude', timeout: 60000 });
    expect(engine).toBeInstanceOf(ClaudeEngine);
  });

  it('should throw error for codex engine (not yet implemented)', () => {
    expect(() => createEngine({ type: 'codex' })).toThrow('not yet implemented');
  });
});
