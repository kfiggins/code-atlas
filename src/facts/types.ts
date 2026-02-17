/**
 * Facts extracted from the codebase without AI analysis
 */

export interface LanguageInfo {
  language: string;
  fileCount: number;
  percentage: number;
}

export interface ConfigFile {
  type: string;
  path: string;
}

export interface Facts {
  // Language distribution
  languages: LanguageInfo[];

  // Notable configuration files
  configs: ConfigFile[];

  // Application entrypoints
  entrypoints: string[];

  // Route/controller/handler files
  routes: string[];
  controllers: string[];
  handlers: string[];
  services: string[];

  // Database and migrations
  dbMigrations: string[];

  // Job/worker files
  jobs: string[];
  workers: string[];

  // Test directories/files
  tests: string[];

  // Statistics
  totalFiles: number;
  totalSize: number;
}
