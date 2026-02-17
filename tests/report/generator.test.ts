import { describe, it, expect } from 'vitest';
import { ReportGenerator } from '../../src/report/generator.js';
import type { Scope } from '../../src/types.js';

describe('Report Generator', () => {
  const generator = new ReportGenerator();

  const sampleMarkdown = `
# 1. Executive Map
This is the executive summary of the codebase.

# 2. How to Find Things
Use the navigation guide to find what you need.

# 3. Data Flow Overview
Here's how data flows through the system.

\`\`\`mermaid
flowchart TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

# 4. Key Modules and Responsibilities
List of important modules.

# 5. Edge Cases and Foot-guns
Watch out for these issues.

# 6. Operational Reality
How to run and operate the system.

# 7. Change Guide
Guidelines for making changes safely.
`;

  describe('parseMarkdown', () => {
    it('should parse markdown into structured report', () => {
      const scope: Scope = { type: 'repo', value: 'repo' };
      const report = generator.parseMarkdown(sampleMarkdown, scope, 42);

      expect(report.metadata.scope).toBe('repo');
      expect(report.metadata.scopeValue).toBe('repo');
      expect(report.metadata.filesAnalyzed).toBe(42);
      expect(report.metadata.generatedAt).toBeTruthy();
      expect(report.sections).toHaveLength(7);
    });

    it('should extract all required sections', () => {
      const scope: Scope = { type: 'repo', value: 'repo' };
      const report = generator.parseMarkdown(sampleMarkdown, scope, 10);

      const sectionIds = report.sections.map(s => s.id);
      expect(sectionIds).toContain('executive-map');
      expect(sectionIds).toContain('how-to-find-things');
      expect(sectionIds).toContain('data-flow-overview');
      expect(sectionIds).toContain('key-modules');
      expect(sectionIds).toContain('edge-cases');
      expect(sectionIds).toContain('operational-reality');
      expect(sectionIds).toContain('change-guide');
    });

    it('should extract Mermaid diagrams', () => {
      const scope: Scope = { type: 'repo', value: 'repo' };
      const report = generator.parseMarkdown(sampleMarkdown, scope, 10);

      const dataFlowSection = report.sections.find(s => s.id === 'data-flow-overview');
      expect(dataFlowSection?.mermaid).toBeTruthy();
      expect(dataFlowSection?.mermaid).toContain('flowchart TD');
      expect(dataFlowSection?.mermaid).toContain('A[Start]');
    });

    it('should include feature walkthrough for feature scope', () => {
      const markdownWithFeature = sampleMarkdown + `
# 8. Feature Walkthrough
Detailed walkthrough of the feature.

\`\`\`mermaid
sequenceDiagram
    User->>API: Request
    API->>DB: Query
    DB->>API: Response
    API->>User: Result
\`\`\`
`;
      const scope: Scope = { type: 'feature', value: 'authentication' };
      const report = generator.parseMarkdown(markdownWithFeature, scope, 10);

      expect(report.sections).toHaveLength(8);
      const featureSection = report.sections.find(s => s.id === 'feature-walkthrough');
      expect(featureSection).toBeTruthy();
      expect(featureSection?.mermaid).toContain('sequenceDiagram');
    });
  });

  describe('generateMarkdown', () => {
    it('should generate markdown from report structure', () => {
      const scope: Scope = { type: 'repo', value: 'repo' };
      const report = generator.parseMarkdown(sampleMarkdown, scope, 10);
      const markdown = generator.generateMarkdown(report);

      expect(markdown).toContain('# Executive Map');
      expect(markdown).toContain('# How to Find Things');
      expect(markdown).toContain('# Data Flow Overview');
      expect(markdown).toContain('Files analyzed: 10');
    });

    it('should include Mermaid diagrams in output', () => {
      const scope: Scope = { type: 'repo', value: 'repo' };
      const report = generator.parseMarkdown(sampleMarkdown, scope, 10);
      const markdown = generator.generateMarkdown(report);

      expect(markdown).toContain('```mermaid');
      expect(markdown).toContain('flowchart TD');
      expect(markdown).toContain('```');
    });

    it('should include metadata in output', () => {
      const scope: Scope = { type: 'folder', value: 'src/api' };
      const report = generator.parseMarkdown(sampleMarkdown, scope, 25);
      const markdown = generator.generateMarkdown(report);

      expect(markdown).toContain('folder: src/api');
      expect(markdown).toContain('Files analyzed: 25');
      expect(markdown).toContain('Generated:');
    });
  });

  describe('validateMermaid', () => {
    it('should validate flowchart diagrams', () => {
      const mermaid = 'flowchart TD\n    A --> B';
      expect(generator.validateMermaid(mermaid)).toBe(true);
    });

    it('should validate sequence diagrams', () => {
      const mermaid = 'sequenceDiagram\n    Alice->>Bob: Hello';
      expect(generator.validateMermaid(mermaid)).toBe(true);
    });

    it('should validate graph diagrams', () => {
      const mermaid = 'graph LR\n    A --> B';
      expect(generator.validateMermaid(mermaid)).toBe(true);
    });

    it('should reject empty diagrams', () => {
      expect(generator.validateMermaid('')).toBe(false);
      expect(generator.validateMermaid('   ')).toBe(false);
    });

    it('should reject invalid diagrams', () => {
      expect(generator.validateMermaid('not a diagram')).toBe(false);
    });
  });

  describe('countMermaidNodes', () => {
    it('should count nodes in flowchart', () => {
      const mermaid = `flowchart TD
    A[Start] --> B[Process]
    B --> C[End]`;
      const count = generator.countMermaidNodes(mermaid);
      expect(count).toBeGreaterThan(0);
    });

    it('should count nodes in sequence diagram', () => {
      const mermaid = `sequenceDiagram
    Alice->>Bob: Hello
    Bob->>Alice: Hi`;
      const count = generator.countMermaidNodes(mermaid);
      expect(count).toBeGreaterThan(0);
    });

    it('should ignore comment lines', () => {
      const mermaid = `flowchart TD
    %% This is a comment
    A --> B
    %% Another comment`;
      const count = generator.countMermaidNodes(mermaid);
      expect(count).toBeGreaterThan(0);
    });
  });
});
