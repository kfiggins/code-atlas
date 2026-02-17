#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './cli/scan.js';
import { viewCommand } from './cli/view.js';
import { statusCommand } from './cli/status.js';
import { cleanCommand } from './cli/clean.js';

const program = new Command();

program
  .name('repoexplain')
  .description('Repository explainer with AI-powered analysis and diagrams')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan repository and generate explainer')
  .option('--scope <scope>', 'Scope: repo, folder:<path>, or feature:<query>', 'repo')
  .option('--include <patterns...>', 'Additional file patterns to include')
  .option('--exclude <patterns...>', 'Additional file patterns to exclude')
  .option('--verbose', 'Verbose output')
  .action(scanCommand);

program
  .command('view')
  .description('Open the web viewer for generated reports')
  .option('--scope <scope>', 'Scope to view (default: most recent)')
  .action(viewCommand);

program
  .command('status')
  .description('Show status of cached reports')
  .action(statusCommand);

program
  .command('clean')
  .description('Clean cached artifacts')
  .option('--scope <scope>', 'Scope to clean (if not specified, cleans all)')
  .action(cleanCommand);

program.parse();
