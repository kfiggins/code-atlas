import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Report } from './types.js';
import { getOutputDir } from '../core/manifest.js';

export function saveReport(repoRoot: string, scopeId: string, report: Report, markdown: string): void {
  const outputDir = getOutputDir(repoRoot, scopeId);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Save structured JSON report
  const jsonPath = join(outputDir, 'report.json');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

  // Save markdown report
  const mdPath = join(outputDir, 'report.md');
  writeFileSync(mdPath, markdown, 'utf-8');
}

export function loadReport(repoRoot: string, scopeId: string): Report | null {
  const outputDir = getOutputDir(repoRoot, scopeId);
  const jsonPath = join(outputDir, 'report.json');

  if (!existsSync(jsonPath)) {
    return null;
  }

  try {
    const content = readFileSync(jsonPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load report from ${jsonPath}:`, error);
    return null;
  }
}

export function loadMarkdownReport(repoRoot: string, scopeId: string): string | null {
  const outputDir = getOutputDir(repoRoot, scopeId);
  const mdPath = join(outputDir, 'report.md');

  if (!existsSync(mdPath)) {
    return null;
  }

  try {
    return readFileSync(mdPath, 'utf-8');
  } catch (error) {
    console.warn(`Failed to load markdown report from ${mdPath}:`, error);
    return null;
  }
}
