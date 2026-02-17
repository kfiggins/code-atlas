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

  // TODO: Phase 3 - Call AI engine
  // TODO: Phase 4 - Generate report

  console.log();
  console.log(chalk.green('✓ Scan complete!'));
  console.log(chalk.gray(`  Run 'repoexplain status' to see details`));
}
