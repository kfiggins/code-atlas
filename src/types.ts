/**
 * Core types for Code Atlas
 */

export type ScopeType = 'repo' | 'folder' | 'feature';

export interface Scope {
  type: ScopeType;
  value: string; // 'repo', 'src/api', 'authentication', etc.
}

export interface FileInfo {
  path: string;
  hash: string; // SHA256
  size: number;
}

export interface Manifest {
  scopeId: string;
  scope: Scope;
  repoRoot: string;
  includedFiles: FileInfo[];
  excludedPatterns: string[];
  timestamp: string; // ISO-8601
  toolVersion: string;
  promptVersion: string;
}

export interface Config {
  maxFilesRepo: number;
  maxFilesFolder: number;
  maxFilesFeature: number;
  maxFileSizeKB: number;
  ignorePatterns: string[];
  binaryExtensions: string[];
  engine: 'claude' | 'codex';
  diagramNodeCap: number;
}

export interface CollectionOptions {
  scope: Scope;
  maxFiles: number;
  maxFileSizeBytes: number;
  ignorePatterns: string[];
  binaryExtensions: string[];
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface CollectionResult {
  files: FileInfo[];
  skippedFiles: string[];
  totalSize: number;
}
