import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  copyViewerToOutput,
  findScopes,
  getMostRecentScope,
} from '../../src/viewer/viewer-manager.js';

describe('Viewer Manager', () => {
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'test-repo-viewer');

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

  describe('findScopes', () => {
    it('should find all scope directories', () => {
      const repoexplainDir = join(testDir, '.repoexplain');
      mkdirSync(join(repoexplainDir, 'repo'), { recursive: true });
      mkdirSync(join(repoexplainDir, 'folder-src'), { recursive: true });
      mkdirSync(join(repoexplainDir, 'feature-auth'), { recursive: true });

      const scopes = findScopes(testDir);

      expect(scopes).toHaveLength(3);
      expect(scopes).toContain('repo');
      expect(scopes).toContain('folder-src');
      expect(scopes).toContain('feature-auth');
    });

    it('should return empty array when no .repoexplain directory exists', () => {
      const scopes = findScopes(testDir);
      expect(scopes).toEqual([]);
    });

    it('should return empty array when .repoexplain is empty', () => {
      mkdirSync(join(testDir, '.repoexplain'));
      const scopes = findScopes(testDir);
      expect(scopes).toEqual([]);
    });
  });

  describe('getMostRecentScope', () => {
    it('should return most recently modified scope', () => {
      const repoexplainDir = join(testDir, '.repoexplain');

      // Create two scopes with different timestamps
      mkdirSync(join(repoexplainDir, 'repo'), { recursive: true });
      mkdirSync(join(repoexplainDir, 'folder-src'), { recursive: true });

      const oldTimestamp = new Date('2024-01-01').toISOString();
      const newTimestamp = new Date('2024-01-02').toISOString();

      writeFileSync(
        join(repoexplainDir, 'repo', 'manifest.json'),
        JSON.stringify({ timestamp: oldTimestamp }),
        'utf-8'
      );

      writeFileSync(
        join(repoexplainDir, 'folder-src', 'manifest.json'),
        JSON.stringify({ timestamp: newTimestamp }),
        'utf-8'
      );

      const mostRecent = getMostRecentScope(testDir);
      expect(mostRecent).toBe('folder-src');
    });

    it('should return null when no scopes exist', () => {
      const mostRecent = getMostRecentScope(testDir);
      expect(mostRecent).toBeNull();
    });

    it('should handle scopes without manifests', () => {
      const repoexplainDir = join(testDir, '.repoexplain');
      mkdirSync(join(repoexplainDir, 'repo'), { recursive: true });
      mkdirSync(join(repoexplainDir, 'folder-src'), { recursive: true });

      writeFileSync(
        join(repoexplainDir, 'repo', 'manifest.json'),
        JSON.stringify({ timestamp: new Date().toISOString() }),
        'utf-8'
      );

      const mostRecent = getMostRecentScope(testDir);
      expect(mostRecent).toBe('repo');
    });
  });

  describe('copyViewerToOutput', () => {
    it('should copy viewer HTML to output directory', () => {
      const outputDir = join(testDir, 'output');
      mkdirSync(outputDir, { recursive: true });

      copyViewerToOutput(outputDir);

      const viewerPath = join(outputDir, 'index.html');
      expect(existsSync(viewerPath)).toBe(true);
    });
  });
});
