import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { FileNote } from './types.js';
import { getOutputDir } from '../core/manifest.js';

export function saveFileNotes(repoRoot: string, scopeId: string, notes: FileNote[]): void {
  const outputDir = getOutputDir(repoRoot, scopeId);
  const notesPath = join(outputDir, 'notes.json');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(notesPath, JSON.stringify(notes, null, 2), 'utf-8');
}

export function loadFileNotes(repoRoot: string, scopeId: string): FileNote[] | null {
  const outputDir = getOutputDir(repoRoot, scopeId);
  const notesPath = join(outputDir, 'notes.json');

  if (!existsSync(notesPath)) {
    return null;
  }

  try {
    const content = readFileSync(notesPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load notes from ${notesPath}:`, error);
    return null;
  }
}
