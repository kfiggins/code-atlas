import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { getScopeId } from '../core/manifest.js';
import { parseScope } from './scan.js';

interface CleanOptions {
  scope?: string;
}

export async function cleanCommand(options: CleanOptions): Promise<void> {
  const repoRoot = process.cwd();
  const repoexplainDir = join(repoRoot, '.repoexplain');

  console.log(chalk.blue('🧹 Code Atlas - Clean\n'));

  if (!existsSync(repoexplainDir)) {
    console.log(chalk.yellow('No cached artifacts found.'));
    return;
  }

  if (options.scope) {
    // Clean specific scope
    const scope = parseScope(options.scope);
    const scopeId = getScopeId(scope);
    const scopeDir = join(repoexplainDir, scopeId);

    if (!existsSync(scopeDir)) {
      console.log(chalk.yellow(`No cached artifacts found for scope: ${options.scope}`));
      return;
    }

    console.log(chalk.cyan(`Removing artifacts for: ${scope.type}:${scope.value}`));
    rmSync(scopeDir, { recursive: true, force: true });
    console.log(chalk.green('✓ Artifacts removed'));
  } else {
    // Clean all
    console.log(chalk.cyan('Removing all cached artifacts...'));
    rmSync(repoexplainDir, { recursive: true, force: true });
    console.log(chalk.green('✓ All artifacts removed'));
  }
}
