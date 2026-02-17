import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Facts } from './types.js';
import { getOutputDir } from '../core/manifest.js';

export function saveFacts(repoRoot: string, scopeId: string, facts: Facts): void {
  const outputDir = getOutputDir(repoRoot, scopeId);
  const factsPath = join(outputDir, 'facts.json');

  // Ensure directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(factsPath, JSON.stringify(facts, null, 2), 'utf-8');
}

export function loadFacts(repoRoot: string, scopeId: string): Facts | null {
  const outputDir = getOutputDir(repoRoot, scopeId);
  const factsPath = join(outputDir, 'facts.json');

  if (!existsSync(factsPath)) {
    return null;
  }

  try {
    const content = readFileSync(factsPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load facts from ${factsPath}:`, error);
    return null;
  }
}
