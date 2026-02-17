import type { Report, ReportSection, ReportMetadata } from './types.js';
import { SECTION_IDS, SECTION_TITLES } from './types.js';
import type { Scope } from '../types.js';

const TOOL_VERSION = '1.0.0';

export class ReportGenerator {
  /**
   * Parse markdown output from engine into structured Report
   */
  parseMarkdown(markdown: string, scope: Scope, filesAnalyzed: number): Report {
    const sections = this.extractSections(markdown, scope.type === 'feature');

    const metadata: ReportMetadata = {
      scope: scope.type,
      scopeValue: scope.value,
      generatedAt: new Date().toISOString(),
      toolVersion: TOOL_VERSION,
      filesAnalyzed,
    };

    return {
      metadata,
      sections,
    };
  }

  private extractSections(markdown: string, isFeatureScope: boolean): ReportSection[] {
    const sections: ReportSection[] = [];

    // Define section patterns based on the headings we expect
    const sectionPatterns: Array<{ id: string; pattern: RegExp }> = [
      { id: SECTION_IDS.EXECUTIVE_MAP, pattern: /# 1\. Executive Map/i },
      { id: SECTION_IDS.HOW_TO_FIND, pattern: /# 2\. How to Find Things/i },
      { id: SECTION_IDS.DATA_FLOW, pattern: /# 3\. Data Flow Overview/i },
      { id: SECTION_IDS.KEY_MODULES, pattern: /# 4\. Key Modules/i },
      { id: SECTION_IDS.EDGE_CASES, pattern: /# 5\. Edge Cases/i },
      { id: SECTION_IDS.OPERATIONAL, pattern: /# 6\. Operational Reality/i },
      { id: SECTION_IDS.CHANGE_GUIDE, pattern: /# 7\. Change Guide/i },
    ];

    if (isFeatureScope) {
      sectionPatterns.push({
        id: SECTION_IDS.FEATURE_WALKTHROUGH,
        pattern: /# 8\. Feature Walkthrough/i,
      });
    }

    for (let i = 0; i < sectionPatterns.length; i++) {
      const { id, pattern } = sectionPatterns[i];
      const match = markdown.match(pattern);

      if (!match) {
        // Section not found, create placeholder
        sections.push({
          id,
          title: SECTION_TITLES[id],
          content: 'Section not generated',
        });
        continue;
      }

      // Find start and end of this section
      const startIndex = match.index!;
      const nextPattern = sectionPatterns[i + 1]?.pattern;
      const nextMatch = nextPattern ? markdown.match(nextPattern) : null;
      const endIndex = nextMatch?.index ?? markdown.length;

      const sectionContent = markdown.slice(startIndex, endIndex).trim();

      // Extract mermaid diagrams from this section
      const mermaidMatch = sectionContent.match(/```mermaid\n([\s\S]*?)```/);
      const mermaid = mermaidMatch?.[1]?.trim();

      // Remove heading from content
      const contentWithoutHeading = sectionContent.replace(/^# \d+\. .+\n/, '').trim();

      sections.push({
        id,
        title: SECTION_TITLES[id],
        content: contentWithoutHeading,
        mermaid,
      });
    }

    return sections;
  }

  /**
   * Generate markdown report from structured Report
   */
  generateMarkdown(report: Report): string {
    let markdown = `# ${report.metadata.scope}: ${report.metadata.scopeValue}\n\n`;
    markdown += `*Generated: ${new Date(report.metadata.generatedAt).toLocaleString()}*\n`;
    markdown += `*Files analyzed: ${report.metadata.filesAnalyzed}*\n\n`;
    markdown += `---\n\n`;

    for (const section of report.sections) {
      markdown += `# ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;

      if (section.mermaid) {
        markdown += `\`\`\`mermaid\n${section.mermaid}\n\`\`\`\n\n`;
      }

      markdown += `---\n\n`;
    }

    return markdown;
  }

  /**
   * Validate Mermaid diagram syntax (basic check)
   */
  validateMermaid(mermaid: string): boolean {
    if (!mermaid || mermaid.trim().length === 0) {
      return false;
    }

    // Basic validation: check for common Mermaid diagram types
    const diagramTypes = [
      'graph',
      'flowchart',
      'sequenceDiagram',
      'classDiagram',
      'stateDiagram',
      'erDiagram',
      'journey',
      'gantt',
    ];

    const firstLine = mermaid.trim().split('\n')[0].toLowerCase();
    return diagramTypes.some((type) => firstLine.includes(type.toLowerCase()));
  }

  /**
   * Count nodes in Mermaid diagram (approximate)
   */
  countMermaidNodes(mermaid: string): number {
    // Count lines that define nodes (contain arrows, parentheses, or brackets)
    const lines = mermaid.split('\n');
    let nodeCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('%%')) {
        continue;
      }

      // Count node definitions (flowchart arrows, sequence diagram arrows, node brackets)
      if (
        trimmed.includes('-->') ||
        trimmed.includes('->>') ||
        trimmed.includes('[') ||
        trimmed.includes('(')
      ) {
        nodeCount++;
      }
    }

    return nodeCount;
  }
}
