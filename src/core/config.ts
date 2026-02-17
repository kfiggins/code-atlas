import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Config } from '../types.js';

const DEFAULT_CONFIG: Config = {
  maxFilesRepo: 200,
  maxFilesFolder: 500,
  maxFilesFeature: 120,
  maxFileSizeKB: 200,
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.next',
    '.turbo',
    '.cache',
    'coverage',
    'vendor',
    '.git',
  ],
  binaryExtensions: [
    '.png', '.jpg', '.jpeg', '.gif', '.pdf',
    '.zip', '.gz', '.tar', '.jar', '.class',
    '.exe', '.dll', '.dylib', '.so', '.a',
    '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot',
  ],
  engine: 'claude',
  diagramNodeCap: 20,
};

export function loadConfig(repoRoot: string): Config {
  const configPath = join(repoRoot, 'repoexplain.config.json');

  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const userConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch (error) {
    console.warn(`Failed to load config from ${configPath}, using defaults`);
    return { ...DEFAULT_CONFIG };
  }
}

export function getDefaultConfig(): Config {
  return { ...DEFAULT_CONFIG };
}
