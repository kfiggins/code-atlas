import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { saveFacts, loadFacts } from '../../src/facts/facts-manager.js';
import type { Facts } from '../../src/facts/types.js';

describe('Facts Manager', () => {
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'test-repo-facts');

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

  const createTestFacts = (): Facts => ({
    languages: [
      { language: 'TypeScript', fileCount: 10, percentage: 67 },
      { language: 'Python', fileCount: 5, percentage: 33 },
    ],
    configs: [
      { type: 'npm', path: 'package.json' },
      { type: 'docker', path: 'Dockerfile' },
    ],
    entrypoints: ['src/index.ts', 'main.py'],
    routes: ['src/routes/api.ts'],
    controllers: ['src/controllers/UserController.ts'],
    handlers: [],
    services: ['src/services/UserService.ts'],
    dbMigrations: ['db/migrations/001_init.sql'],
    jobs: ['src/jobs/EmailJob.ts'],
    workers: [],
    tests: ['tests/unit/user.test.ts'],
    totalFiles: 15,
    totalSize: 150000,
  });

  it('should save facts to JSON file', () => {
    const facts = createTestFacts();
    const scopeId = 'repo';

    saveFacts(testDir, scopeId, facts);

    const factsPath = join(testDir, '.repoexplain', scopeId, 'facts.json');
    expect(existsSync(factsPath)).toBe(true);
  });

  it('should load facts from JSON file', () => {
    const facts = createTestFacts();
    const scopeId = 'repo';

    saveFacts(testDir, scopeId, facts);
    const loaded = loadFacts(testDir, scopeId);

    expect(loaded).toBeTruthy();
    expect(loaded?.languages).toEqual(facts.languages);
    expect(loaded?.configs).toEqual(facts.configs);
    expect(loaded?.totalFiles).toBe(facts.totalFiles);
  });

  it('should return null for non-existent facts file', () => {
    const loaded = loadFacts(testDir, 'nonexistent');
    expect(loaded).toBeNull();
  });

  it('should preserve all fact types on save/load', () => {
    const facts = createTestFacts();
    const scopeId = 'repo';

    saveFacts(testDir, scopeId, facts);
    const loaded = loadFacts(testDir, scopeId);

    expect(loaded?.entrypoints).toEqual(facts.entrypoints);
    expect(loaded?.routes).toEqual(facts.routes);
    expect(loaded?.controllers).toEqual(facts.controllers);
    expect(loaded?.services).toEqual(facts.services);
    expect(loaded?.dbMigrations).toEqual(facts.dbMigrations);
    expect(loaded?.jobs).toEqual(facts.jobs);
    expect(loaded?.tests).toEqual(facts.tests);
  });
});
