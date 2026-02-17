import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import type { Scope, CollectionOptions } from '../types.js';
import { loadConfig } from '../core/config.js';
import { FileCollector } from '../core/file-collector.js';
import {
  createManifest,
  saveManifest,
  loadManifest,
  detectChanges,
  getScopeId,
} from '../core/manifest.js';
import { extractFacts } from '../facts/extractor.js';
import { saveFacts } from '../facts/facts-manager.js';
import { ReportGenerator } from '../report/generator.js';
import { saveReport } from '../report/report-manager.js';

interface ScanOptions {
  scope: string;
  include?: string[];
  exclude?: string[];
  verbose?: boolean;
}

export function parseScope(scopeStr: string): Scope {
  if (scopeStr === 'repo') {
    return { type: 'repo', value: 'repo' };
  }

  if (scopeStr.startsWith('folder:')) {
    return { type: 'folder', value: scopeStr.slice('folder:'.length) };
  }

  if (scopeStr.startsWith('feature:')) {
    return { type: 'feature', value: scopeStr.slice('feature:'.length) };
  }

  throw new Error(`Invalid scope format: ${scopeStr}. Use 'repo', 'folder:<path>', or 'feature:<query>'`);
}

export async function scanCommand(options: ScanOptions): Promise<void> {
  const repoRoot = process.cwd();

  console.log(chalk.blue('🔍 Code Atlas - Repository Scan\n'));

  // Parse scope
  const scope = parseScope(options.scope);
  const scopeId = getScopeId(scope);

  console.log(chalk.gray(`Repository: ${repoRoot}`));
  console.log(chalk.gray(`Scope: ${scope.type} (${scope.value})`));
  console.log();

  // Load config
  const config = loadConfig(repoRoot);

  // Determine max files based on scope
  const maxFiles =
    scope.type === 'repo'
      ? config.maxFilesRepo
      : scope.type === 'folder'
      ? config.maxFilesFolder
      : config.maxFilesFeature;

  // Validate scope path for folder scope
  if (scope.type === 'folder') {
    const folderPath = resolve(repoRoot, scope.value);
    if (!existsSync(folderPath)) {
      console.error(chalk.red(`✗ Folder not found: ${scope.value}`));
      process.exit(1);
    }
  }

  // Create collection options
  const collectionOptions: CollectionOptions = {
    scope,
    maxFiles,
    maxFileSizeBytes: config.maxFileSizeKB * 1024,
    ignorePatterns: config.ignorePatterns,
    binaryExtensions: config.binaryExtensions,
    includePatterns: options.include,
    excludePatterns: options.exclude,
  };

  // Collect files
  console.log(chalk.cyan('📁 Collecting files...'));
  const collector = new FileCollector(repoRoot, collectionOptions);
  const result = collector.collect();

  console.log(chalk.green(`✓ Collected ${result.files.length} files`));
  if (result.skippedFiles.length > 0) {
    console.log(chalk.gray(`  Skipped ${result.skippedFiles.length} files`));
  }
  console.log(chalk.gray(`  Total size: ${(result.totalSize / 1024).toFixed(2)} KB`));
  console.log();

  // Load previous manifest to detect changes
  const previousManifest = loadManifest(repoRoot, scopeId);

  if (previousManifest) {
    console.log(chalk.cyan('🔄 Checking for changes...'));
    const changes = detectChanges(previousManifest, result.files);

    if (!changes.hasChanges) {
      console.log(chalk.green('✓ No changes detected since last scan'));
      console.log(chalk.gray(`  Last scan: ${new Date(previousManifest.timestamp).toLocaleString()}`));
      return;
    }

    console.log(chalk.yellow(`△ Changes detected:`));
    if (changes.addedFiles.length > 0) {
      console.log(chalk.gray(`  Added: ${changes.addedFiles.length} files`));
    }
    if (changes.modifiedFiles.length > 0) {
      console.log(chalk.gray(`  Modified: ${changes.modifiedFiles.length} files`));
    }
    if (changes.removedFiles.length > 0) {
      console.log(chalk.gray(`  Removed: ${changes.removedFiles.length} files`));
    }
    console.log();
  }

  // Create and save manifest
  console.log(chalk.cyan('💾 Saving manifest...'));
  const manifest = createManifest(
    repoRoot,
    scope,
    result.files,
    [...config.ignorePatterns, ...(options.exclude || [])]
  );

  saveManifest(repoRoot, manifest);
  console.log(chalk.green(`✓ Manifest saved: .repoexplain/${scopeId}/manifest.json`));

  // Extract facts
  console.log(chalk.cyan('🔍 Extracting facts...'));
  const facts = extractFacts(result.files, result.totalSize);

  if (options.verbose) {
    console.log(chalk.gray(`  Languages: ${facts.languages.map(l => l.language).join(', ')}`));
    console.log(chalk.gray(`  Configs: ${facts.configs.length}`));
    console.log(chalk.gray(`  Entrypoints: ${facts.entrypoints.length}`));
  }

  saveFacts(repoRoot, scopeId, facts);
  console.log(chalk.green(`✓ Facts extracted: .repoexplain/${scopeId}/facts.json`));

  // Generate report (placeholder for Phase 4)
  // In production, this would call the AI engine to analyze files
  // For now, we generate a basic report from facts only
  console.log(chalk.cyan('📝 Generating report...'));

  const reportGenerator = new ReportGenerator();
  const mockMarkdown = generateMockReport(scope, facts);
  const report = reportGenerator.parseMarkdown(mockMarkdown, scope, result.files.length);
  const markdownOutput = reportGenerator.generateMarkdown(report);

  saveReport(repoRoot, scopeId, report, markdownOutput);
  console.log(chalk.green(`✓ Report generated: .repoexplain/${scopeId}/report.json`));
  console.log(chalk.green(`✓ Report generated: .repoexplain/${scopeId}/report.md`));

  console.log();
  console.log(chalk.green('✓ Scan complete!'));
  console.log(chalk.gray(`  Run 'repoexplain status' to see details`));
  console.log(chalk.gray(`  Run 'repoexplain view' to view the report`));
}

// Temporary mock report generator (Phase 4 will use real AI engine)
function generateMockReport(scope: any, facts: any): string {
  const langs = facts.languages.map((l: any) => l.language).join(', ') || 'Unknown';
  const configs = facts.configs.map((c: any) => c.type).join(', ') || 'None';
  const entrypoints = facts.entrypoints.join(', ') || 'None detected';

  return `
# 1. Executive Map

This ${scope.type} contains code written primarily in ${langs}.

**Major Components:**
- ${facts.totalFiles} files analyzed
- Configuration: ${configs}
- Entry points: ${entrypoints}

**Key Dependencies:**
${facts.configs.length > 0 ? facts.configs.map((c: any) => `- ${c.type}: ${c.path}`).join('\n') : '- None detected'}

# 2. How to Find Things

**Finding specific functionality:**
- Routes/Endpoints: ${facts.routes.length} files detected
- Controllers/Handlers: ${facts.controllers.length} files detected
- Services: ${facts.services.length} files detected
- Tests: ${facts.tests.length} files detected

# 3. Data Flow Overview

Data flow analysis based on detected files:

\`\`\`mermaid
flowchart TD
    Start[Entry Points] --> Routes[Routes/Endpoints]
    Routes --> Controllers[Controllers]
    Controllers --> Services[Business Logic]
    Services --> External[External Systems]
\`\`\`

# 4. Key Modules and Responsibilities

**Detected Modules:**
${facts.entrypoints.map((e: string) => `- **${e}**: Application entry point`).join('\n') || '- No key modules identified'}
${facts.routes.slice(0, 5).map((r: string) => `- **${r}**: Routing logic`).join('\n')}

# 5. Edge Cases and Foot-guns

**Potential Areas of Concern:**
- Review error handling in entry points
- Verify database migration ordering
- Check for race conditions in async code

# 6. Operational Reality

**Running Locally:**
- Install dependencies based on detected config files
- Check for .env.example for required environment variables

**Configuration:**
${facts.configs.map((c: any) => `- ${c.path}`).join('\n') || '- No config files detected'}

# 7. Change Guide

**Before Making Changes:**
- Review the relevant files in the detected modules
- Run existing tests: ${facts.tests.length} test files detected
- Check for database migrations if modifying data layer

**Testing:**
- Test files located in: ${facts.tests.join(', ') || 'No test files detected'}
`;
}
