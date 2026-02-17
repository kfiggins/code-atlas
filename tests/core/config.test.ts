import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { loadConfig, getDefaultConfig } from '../../src/core/config.js';

describe('Config', () => {
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'test-repo-config');

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return default config when no config file exists', () => {
    const config = loadConfig(testDir);
    const defaultConfig = getDefaultConfig();

    expect(config).toEqual(defaultConfig);
    expect(config.maxFilesRepo).toBe(200);
    expect(config.maxFilesFolder).toBe(500);
    expect(config.maxFilesFeature).toBe(120);
  });

  it('should merge user config with defaults', () => {
    const userConfig = {
      maxFilesRepo: 100,
      engine: 'codex' as const,
    };

    writeFileSync(
      join(testDir, 'repoexplain.config.json'),
      JSON.stringify(userConfig),
      'utf-8'
    );

    const config = loadConfig(testDir);

    expect(config.maxFilesRepo).toBe(100); // overridden
    expect(config.maxFilesFolder).toBe(500); // default
    expect(config.engine).toBe('codex'); // overridden
  });

  it('should handle invalid JSON gracefully', () => {
    writeFileSync(
      join(testDir, 'repoexplain.config.json'),
      'invalid json{',
      'utf-8'
    );

    const config = loadConfig(testDir);
    const defaultConfig = getDefaultConfig();

    expect(config).toEqual(defaultConfig);
  });

  it('should include all required default patterns', () => {
    const config = getDefaultConfig();

    expect(config.ignorePatterns).toContain('node_modules');
    expect(config.ignorePatterns).toContain('.git');
    expect(config.binaryExtensions).toContain('.png');
    expect(config.binaryExtensions).toContain('.jpg');
  });
});
