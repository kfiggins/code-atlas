import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { Manifest, Scope, FileInfo } from '../types.js';

const TOOL_VERSION = '1.0.0';
const PROMPT_VERSION = '1.0.0';

export function createManifest(
  repoRoot: string,
  scope: Scope,
  files: FileInfo[],
  excludedPatterns: string[]
): Manifest {
  return {
    scopeId: getScopeId(scope),
    scope,
    repoRoot,
    includedFiles: files,
    excludedPatterns,
    timestamp: new Date().toISOString(),
    toolVersion: TOOL_VERSION,
    promptVersion: PROMPT_VERSION,
  };
}

export function getScopeId(scope: Scope): string {
  if (scope.type === 'repo') {
    return 'repo';
  }
  // Convert folder/feature paths to safe IDs
  return `${scope.type}-${scope.value.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

export function getManifestPath(repoRoot: string, scopeId: string): string {
  return join(repoRoot, '.repoexplain', scopeId, 'manifest.json');
}

export function saveManifest(repoRoot: string, manifest: Manifest): void {
  const manifestPath = getManifestPath(repoRoot, manifest.scopeId);
  const dir = dirname(manifestPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

export function loadManifest(repoRoot: string, scopeId: string): Manifest | null {
  const manifestPath = getManifestPath(repoRoot, scopeId);

  if (!existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load manifest from ${manifestPath}:`, error);
    return null;
  }
}

export interface ChangeDetectionResult {
  hasChanges: boolean;
  addedFiles: FileInfo[];
  modifiedFiles: FileInfo[];
  removedFiles: FileInfo[];
  unchangedFiles: FileInfo[];
}

export function detectChanges(
  oldManifest: Manifest,
  newFiles: FileInfo[]
): ChangeDetectionResult {
  const oldFileMap = new Map(oldManifest.includedFiles.map(f => [f.path, f]));
  const newFileMap = new Map(newFiles.map(f => [f.path, f]));

  const addedFiles: FileInfo[] = [];
  const modifiedFiles: FileInfo[] = [];
  const unchangedFiles: FileInfo[] = [];

  // Check new files for additions and modifications
  for (const newFile of newFiles) {
    const oldFile = oldFileMap.get(newFile.path);

    if (!oldFile) {
      addedFiles.push(newFile);
    } else if (oldFile.hash !== newFile.hash) {
      modifiedFiles.push(newFile);
    } else {
      unchangedFiles.push(newFile);
    }
  }

  // Check for removed files
  const removedFiles: FileInfo[] = [];
  for (const oldFile of oldManifest.includedFiles) {
    if (!newFileMap.has(oldFile.path)) {
      removedFiles.push(oldFile);
    }
  }

  const hasChanges = addedFiles.length > 0 || modifiedFiles.length > 0 || removedFiles.length > 0;

  return {
    hasChanges,
    addedFiles,
    modifiedFiles,
    removedFiles,
    unchangedFiles,
  };
}

export function getOutputDir(repoRoot: string, scopeId: string): string {
  return join(repoRoot, '.repoexplain', scopeId);
}
