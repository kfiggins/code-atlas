/**
 * Engine types for AI analysis
 */

export interface EngineConfig {
  type: 'claude' | 'codex';
  timeout?: number; // milliseconds
}

export interface FileNote {
  filePath: string;
  purpose: string;
  keyItems: string[]; // key functions, classes, exports
  externalInteractions: string[];
  todos: string[];
}

export interface EngineResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface IEngine {
  /**
   * Generate file notes for a single file
   */
  generateFileNotes(filePath: string, content: string, language: string): Promise<FileNote | null>;

  /**
   * Generate synthesis report from facts and file notes
   */
  generateSynthesis(
    scope: string,
    facts: any,
    fileNotes: FileNote[],
    diagramNodeCap: number
  ): Promise<string | null>;
}
