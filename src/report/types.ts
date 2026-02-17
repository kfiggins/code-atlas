/**
 * Report types and schema
 */

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  mermaid?: string; // Optional Mermaid diagram
}

export interface ReportMetadata {
  scope: string;
  scopeValue: string;
  generatedAt: string; // ISO-8601
  toolVersion: string;
  filesAnalyzed: number;
}

export interface Report {
  metadata: ReportMetadata;
  sections: ReportSection[];
}

export const SECTION_IDS = {
  EXECUTIVE_MAP: 'executive-map',
  HOW_TO_FIND: 'how-to-find-things',
  DATA_FLOW: 'data-flow-overview',
  KEY_MODULES: 'key-modules',
  EDGE_CASES: 'edge-cases',
  OPERATIONAL: 'operational-reality',
  CHANGE_GUIDE: 'change-guide',
  FEATURE_WALKTHROUGH: 'feature-walkthrough',
} as const;

export const SECTION_TITLES: Record<string, string> = {
  [SECTION_IDS.EXECUTIVE_MAP]: 'Executive Map',
  [SECTION_IDS.HOW_TO_FIND]: 'How to Find Things',
  [SECTION_IDS.DATA_FLOW]: 'Data Flow Overview',
  [SECTION_IDS.KEY_MODULES]: 'Key Modules and Responsibilities',
  [SECTION_IDS.EDGE_CASES]: 'Edge Cases and Foot-guns',
  [SECTION_IDS.OPERATIONAL]: 'Operational Reality',
  [SECTION_IDS.CHANGE_GUIDE]: 'Change Guide',
  [SECTION_IDS.FEATURE_WALKTHROUGH]: 'Feature Walkthrough',
};
