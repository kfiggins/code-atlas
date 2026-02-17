import { existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { getScopeId } from '../core/manifest.js';
import { parseScope } from './scan.js';
import {
  copyViewerToOutput,
  openViewer,
  findScopes,
  getMostRecentScope,
} from '../viewer/viewer-manager.js';

interface ViewOptions {
  scope?: string;
}

export async function viewCommand(options: ViewOptions): Promise<void> {
  const repoRoot = process.cwd();

  console.log(chalk.blue('👁️  Code Atlas - Viewer\n'));

  // Determine which scope to view
  let scopeId: string;

  if (options.scope) {
    const scope = parseScope(options.scope);
    scopeId = getScopeId(scope);
  } else {
    // Use most recent scope
    const mostRecent = getMostRecentScope(repoRoot);

    if (!mostRecent) {
      console.log(chalk.yellow('No scans found.'));
      console.log(chalk.gray('Run \'repoexplain scan\' first to generate a report.'));
      return;
    }

    scopeId = mostRecent;
  }

  // Check if report exists
  const outputDir = join(repoRoot, '.repoexplain', scopeId);
  const reportPath = join(outputDir, 'report.json');

  if (!existsSync(reportPath)) {
    console.log(chalk.red(`✗ Report not found for scope: ${scopeId}`));
    console.log(chalk.gray('Run \'repoexplain scan --scope <scope>\' to generate it.'));

    const availableScopes = findScopes(repoRoot);
    if (availableScopes.length > 0) {
      console.log(chalk.gray(`\nAvailable scopes: ${availableScopes.join(', ')}`));
    }
    return;
  }

  // Copy viewer to output directory
  console.log(chalk.cyan('📋 Preparing viewer...'));
  copyViewerToOutput(outputDir);

  const viewerPath = join(outputDir, 'index.html');

  console.log(chalk.green(`✓ Opening viewer for: ${scopeId}`));
  console.log(chalk.gray(`  ${viewerPath}`));

  // Open in browser
  openViewer(viewerPath);

  console.log();
  console.log(chalk.green('✓ Viewer opened in browser!'));
}
