import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { saveReport, loadReport, loadMarkdownReport } from '../../src/report/report-manager.js';
import type { Report } from '../../src/report/types.js';

describe('Report Manager', () => {
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'test-repo-report');

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

  const createTestReport = (): Report => ({
    metadata: {
      scope: 'repo',
      scopeValue: 'repo',
      generatedAt: new Date().toISOString(),
      toolVersion: '1.0.0',
      filesAnalyzed: 42,
    },
    sections: [
      {
        id: 'executive-map',
        title: 'Executive Map',
        content: 'This is the executive summary',
      },
      {
        id: 'data-flow-overview',
        title: 'Data Flow Overview',
        content: 'Data flow description',
        mermaid: 'flowchart TD\n    A --> B',
      },
    ],
  });

  it('should save report as JSON and markdown', () => {
    const report = createTestReport();
    const markdown = '# Test Report\n\nContent here';
    const scopeId = 'repo';

    saveReport(testDir, scopeId, report, markdown);

    const jsonPath = join(testDir, '.repoexplain', scopeId, 'report.json');
    const mdPath = join(testDir, '.repoexplain', scopeId, 'report.md');

    expect(existsSync(jsonPath)).toBe(true);
    expect(existsSync(mdPath)).toBe(true);
  });

  it('should load report from JSON', () => {
    const report = createTestReport();
    const markdown = '# Test Report';
    const scopeId = 'repo';

    saveReport(testDir, scopeId, report, markdown);
    const loaded = loadReport(testDir, scopeId);

    expect(loaded).toBeTruthy();
    expect(loaded?.metadata.filesAnalyzed).toBe(42);
    expect(loaded?.sections).toHaveLength(2);
  });

  it('should load markdown report', () => {
    const report = createTestReport();
    const markdown = '# Test Report\n\nThis is markdown content';
    const scopeId = 'repo';

    saveReport(testDir, scopeId, report, markdown);
    const loaded = loadMarkdownReport(testDir, scopeId);

    expect(loaded).toBe(markdown);
  });

  it('should return null for non-existent report', () => {
    const loaded = loadReport(testDir, 'nonexistent');
    expect(loaded).toBeNull();
  });

  it('should return null for non-existent markdown report', () => {
    const loaded = loadMarkdownReport(testDir, 'nonexistent');
    expect(loaded).toBeNull();
  });

  it('should preserve all report properties on save/load', () => {
    const report = createTestReport();
    const markdown = '# Test';
    const scopeId = 'repo';

    saveReport(testDir, scopeId, report, markdown);
    const loaded = loadReport(testDir, scopeId);

    expect(loaded?.metadata.scope).toBe(report.metadata.scope);
    expect(loaded?.metadata.scopeValue).toBe(report.metadata.scopeValue);
    expect(loaded?.sections[0].id).toBe('executive-map');
    expect(loaded?.sections[1].mermaid).toBe('flowchart TD\n    A --> B');
  });
});
