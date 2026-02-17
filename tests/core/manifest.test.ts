import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  createManifest,
  saveManifest,
  loadManifest,
  detectChanges,
  getScopeId,
} from '../../src/core/manifest.js';
import type { Scope, FileInfo } from '../../src/types.js';

describe('Manifest', () => {
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'test-repo-manifest');

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

  it('should create manifest with correct structure', () => {
    const scope: Scope = { type: 'repo', value: 'repo' };
    const files: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc123', size: 100 },
      { path: 'README.md', hash: 'def456', size: 50 },
    ];

    const manifest = createManifest(testDir, scope, files, ['node_modules']);

    expect(manifest.scopeId).toBe('repo');
    expect(manifest.scope).toEqual(scope);
    expect(manifest.repoRoot).toBe(testDir);
    expect(manifest.includedFiles).toEqual(files);
    expect(manifest.excludedPatterns).toContain('node_modules');
    expect(manifest.timestamp).toBeTruthy();
    expect(manifest.toolVersion).toBeTruthy();
    expect(manifest.promptVersion).toBeTruthy();
  });

  it('should generate correct scope IDs', () => {
    expect(getScopeId({ type: 'repo', value: 'repo' })).toBe('repo');
    expect(getScopeId({ type: 'folder', value: 'src/api' })).toBe('folder-src-api');
    expect(getScopeId({ type: 'feature', value: 'authentication' })).toBe('feature-authentication');
  });

  it('should save and load manifest', () => {
    const scope: Scope = { type: 'repo', value: 'repo' };
    const files: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc123', size: 100 },
    ];

    const manifest = createManifest(testDir, scope, files, []);
    saveManifest(testDir, manifest);

    const loaded = loadManifest(testDir, 'repo');

    expect(loaded).toBeTruthy();
    expect(loaded?.scopeId).toBe(manifest.scopeId);
    expect(loaded?.includedFiles).toEqual(manifest.includedFiles);
  });

  it('should return null for non-existent manifest', () => {
    const loaded = loadManifest(testDir, 'nonexistent');
    expect(loaded).toBeNull();
  });

  it('should detect no changes when files are identical', () => {
    const scope: Scope = { type: 'repo', value: 'repo' };
    const files: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc123', size: 100 },
      { path: 'README.md', hash: 'def456', size: 50 },
    ];

    const manifest = createManifest(testDir, scope, files, []);
    const changes = detectChanges(manifest, files);

    expect(changes.hasChanges).toBe(false);
    expect(changes.addedFiles).toHaveLength(0);
    expect(changes.modifiedFiles).toHaveLength(0);
    expect(changes.removedFiles).toHaveLength(0);
    expect(changes.unchangedFiles).toHaveLength(2);
  });

  it('should detect added files', () => {
    const scope: Scope = { type: 'repo', value: 'repo' };
    const oldFiles: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc123', size: 100 },
    ];
    const newFiles: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc123', size: 100 },
      { path: 'src/new.ts', hash: 'xyz789', size: 75 },
    ];

    const manifest = createManifest(testDir, scope, oldFiles, []);
    const changes = detectChanges(manifest, newFiles);

    expect(changes.hasChanges).toBe(true);
    expect(changes.addedFiles).toHaveLength(1);
    expect(changes.addedFiles[0].path).toBe('src/new.ts');
  });

  it('should detect modified files', () => {
    const scope: Scope = { type: 'repo', value: 'repo' };
    const oldFiles: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc123', size: 100 },
    ];
    const newFiles: FileInfo[] = [
      { path: 'src/index.ts', hash: 'xyz789', size: 120 }, // changed hash
    ];

    const manifest = createManifest(testDir, scope, oldFiles, []);
    const changes = detectChanges(manifest, newFiles);

    expect(changes.hasChanges).toBe(true);
    expect(changes.modifiedFiles).toHaveLength(1);
    expect(changes.modifiedFiles[0].path).toBe('src/index.ts');
  });

  it('should detect removed files', () => {
    const scope: Scope = { type: 'repo', value: 'repo' };
    const oldFiles: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc123', size: 100 },
      { path: 'src/old.ts', hash: 'def456', size: 50 },
    ];
    const newFiles: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc123', size: 100 },
    ];

    const manifest = createManifest(testDir, scope, oldFiles, []);
    const changes = detectChanges(manifest, newFiles);

    expect(changes.hasChanges).toBe(true);
    expect(changes.removedFiles).toHaveLength(1);
    expect(changes.removedFiles[0].path).toBe('src/old.ts');
  });

  it('should detect multiple types of changes', () => {
    const scope: Scope = { type: 'repo', value: 'repo' };
    const oldFiles: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc123', size: 100 },
      { path: 'src/old.ts', hash: 'def456', size: 50 },
      { path: 'src/unchanged.ts', hash: 'ghi789', size: 75 },
    ];
    const newFiles: FileInfo[] = [
      { path: 'src/index.ts', hash: 'xyz000', size: 120 }, // modified
      { path: 'src/new.ts', hash: 'new111', size: 60 }, // added
      { path: 'src/unchanged.ts', hash: 'ghi789', size: 75 }, // unchanged
      // src/old.ts removed
    ];

    const manifest = createManifest(testDir, scope, oldFiles, []);
    const changes = detectChanges(manifest, newFiles);

    expect(changes.hasChanges).toBe(true);
    expect(changes.modifiedFiles).toHaveLength(1);
    expect(changes.addedFiles).toHaveLength(1);
    expect(changes.removedFiles).toHaveLength(1);
    expect(changes.unchangedFiles).toHaveLength(1);
  });
});
