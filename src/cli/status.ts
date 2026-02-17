import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { loadManifest } from '../core/manifest.js';

export async function statusCommand(): Promise<void> {
  const repoRoot = process.cwd();
  const repoexplainDir = join(repoRoot, '.repoexplain');

  console.log(chalk.blue('📊 Code Atlas - Status\n'));

  if (!existsSync(repoexplainDir)) {
    console.log(chalk.yellow('No scans found. Run \'repoexplain scan\' to create one.'));
    return;
  }

  // Find all scope directories
  const scopeDirs = readdirSync(repoexplainDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  if (scopeDirs.length === 0) {
    console.log(chalk.yellow('No scans found. Run \'repoexplain scan\' to create one.'));
    return;
  }

  console.log(chalk.gray(`Repository: ${repoRoot}\n`));

  for (const scopeId of scopeDirs) {
    const manifest = loadManifest(repoRoot, scopeId);

    if (!manifest) {
      console.log(chalk.red(`✗ ${scopeId} - invalid manifest`));
      continue;
    }

    const timestamp = new Date(manifest.timestamp);
    const timeAgo = getTimeAgo(timestamp);

    console.log(chalk.cyan(`${manifest.scope.type}:${manifest.scope.value}`));
    console.log(chalk.gray(`  Scope ID: ${scopeId}`));
    console.log(chalk.gray(`  Last scan: ${timestamp.toLocaleString()} (${timeAgo})`));
    console.log(chalk.gray(`  Files: ${manifest.includedFiles.length}`));
    console.log(chalk.gray(`  Tool version: ${manifest.toolVersion}`));
    console.log();
  }

  console.log(chalk.gray(`Run 'repoexplain scan --scope <scope>' to update a scan`));
  console.log(chalk.gray(`Run 'repoexplain view' to open the viewer`));
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
