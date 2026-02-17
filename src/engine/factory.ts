import type { IEngine, EngineConfig } from './types.js';
import { ClaudeEngine } from './claude-engine.js';

export function createEngine(config: EngineConfig): IEngine {
  switch (config.type) {
    case 'claude':
      return new ClaudeEngine(config.timeout);
    case 'codex':
      throw new Error('Codex engine not yet implemented (Phase 3)');
    default:
      throw new Error(`Unknown engine type: ${config.type}`);
  }
}
