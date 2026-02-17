import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { saveFileNotes, loadFileNotes } from '../../src/engine/notes-manager.js';
import type { FileNote } from '../../src/engine/types.js';

describe('Notes Manager', () => {
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'test-repo-notes');

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  const createTestNotes = (): FileNote[] => [
    {
      filePath: 'src/index.ts',
      purpose: 'Main entry point for the application',
      keyItems: ['main()', 'setupServer()'],
      externalInteractions: ['PostgreSQL database', 'Redis cache'],
      todos: ['Add error handling', 'Improve logging'],
    },
    {
      filePath: 'src/api/routes.ts',
      purpose: 'Define API routes',
      keyItems: ['router', 'apiRoutes'],
      externalInteractions: ['Express middleware'],
      todos: [],
    },
  ];

  it('should save file notes to JSON file', () => {
    const notes = createTestNotes();
    const scopeId = 'repo';

    saveFileNotes(testDir, scopeId, notes);

    const notesPath = join(testDir, '.repoexplain', scopeId, 'notes.json');
    expect(existsSync(notesPath)).toBe(true);
  });

  it('should load file notes from JSON file', () => {
    const notes = createTestNotes();
    const scopeId = 'repo';

    saveFileNotes(testDir, scopeId, notes);
    const loaded = loadFileNotes(testDir, scopeId);

    expect(loaded).toBeTruthy();
    expect(loaded).toHaveLength(2);
    expect(loaded?.[0].filePath).toBe('src/index.ts');
    expect(loaded?.[0].purpose).toBe('Main entry point for the application');
  });

  it('should return null for non-existent notes file', () => {
    const loaded = loadFileNotes(testDir, 'nonexistent');
    expect(loaded).toBeNull();
  });

  it('should preserve all note properties on save/load', () => {
    const notes = createTestNotes();
    const scopeId = 'repo';

    saveFileNotes(testDir, scopeId, notes);
    const loaded = loadFileNotes(testDir, scopeId);

    expect(loaded?.[0].keyItems).toEqual(notes[0].keyItems);
    expect(loaded?.[0].externalInteractions).toEqual(notes[0].externalInteractions);
    expect(loaded?.[0].todos).toEqual(notes[0].todos);
  });

  it('should handle empty notes array', () => {
    const scopeId = 'repo';

    saveFileNotes(testDir, scopeId, []);
    const loaded = loadFileNotes(testDir, scopeId);

    expect(loaded).toEqual([]);
  });
});
