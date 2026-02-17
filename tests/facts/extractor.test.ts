import { describe, it, expect } from 'vitest';
import { extractFacts } from '../../src/facts/extractor.js';
import type { FileInfo } from '../../src/types.js';

describe('Facts Extractor', () => {
  it('should detect languages from file extensions', () => {
    const files: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc', size: 100 },
      { path: 'src/utils.ts', hash: 'def', size: 100 },
      { path: 'src/api.py', hash: 'ghi', size: 100 },
      { path: 'README.md', hash: 'jkl', size: 100 },
    ];

    const facts = extractFacts(files, 400);

    expect(facts.languages).toHaveLength(2);

    const ts = facts.languages.find(l => l.language === 'TypeScript');
    const py = facts.languages.find(l => l.language === 'Python');

    expect(ts?.fileCount).toBe(2);
    expect(py?.fileCount).toBe(1);
    expect(ts?.percentage).toBeGreaterThan(0);
  });

  it('should detect package.json config', () => {
    const files: FileInfo[] = [
      { path: 'package.json', hash: 'abc', size: 100 },
      { path: 'src/index.ts', hash: 'def', size: 100 },
    ];

    const facts = extractFacts(files, 200);

    expect(facts.configs).toHaveLength(1);
    expect(facts.configs[0].type).toBe('npm');
    expect(facts.configs[0].path).toBe('package.json');
  });

  it('should detect Docker configs', () => {
    const files: FileInfo[] = [
      { path: 'Dockerfile', hash: 'abc', size: 100 },
      { path: 'docker-compose.yml', hash: 'def', size: 100 },
    ];

    const facts = extractFacts(files, 200);

    expect(facts.configs.length).toBeGreaterThanOrEqual(2);
    expect(facts.configs.some(c => c.type === 'docker')).toBe(true);
    expect(facts.configs.some(c => c.type === 'docker-compose')).toBe(true);
  });

  it('should detect Python configs', () => {
    const files: FileInfo[] = [
      { path: 'pyproject.toml', hash: 'abc', size: 100 },
      { path: 'requirements.txt', hash: 'def', size: 100 },
    ];

    const facts = extractFacts(files, 200);

    expect(facts.configs.some(c => c.type === 'python')).toBe(true);
  });

  it('should detect Go configs', () => {
    const files: FileInfo[] = [
      { path: 'go.mod', hash: 'abc', size: 100 },
      { path: 'go.sum', hash: 'def', size: 100 },
    ];

    const facts = extractFacts(files, 200);

    expect(facts.configs.some(c => c.type === 'go')).toBe(true);
  });

  it('should detect Node.js entrypoints', () => {
    const files: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc', size: 100 },
      { path: 'src/server.ts', hash: 'def', size: 100 },
      { path: 'src/utils.ts', hash: 'ghi', size: 100 },
    ];

    const facts = extractFacts(files, 300);

    expect(facts.entrypoints).toContain('src/index.ts');
    expect(facts.entrypoints).toContain('src/server.ts');
    expect(facts.entrypoints).not.toContain('src/utils.ts');
  });

  it('should detect Python entrypoints', () => {
    const files: FileInfo[] = [
      { path: 'main.py', hash: 'abc', size: 100 },
      { path: 'app.py', hash: 'def', size: 100 },
      { path: 'utils.py', hash: 'ghi', size: 100 },
    ];

    const facts = extractFacts(files, 300);

    expect(facts.entrypoints).toContain('main.py');
    expect(facts.entrypoints).toContain('app.py');
    expect(facts.entrypoints).not.toContain('utils.py');
  });

  it('should detect Go entrypoints', () => {
    const files: FileInfo[] = [
      { path: 'cmd/server/main.go', hash: 'abc', size: 100 },
      { path: 'cmd/cli/main.go', hash: 'def', size: 100 },
      { path: 'pkg/utils.go', hash: 'ghi', size: 100 },
    ];

    const facts = extractFacts(files, 300);

    expect(facts.entrypoints).toContain('cmd/server/main.go');
    expect(facts.entrypoints).toContain('cmd/cli/main.go');
    expect(facts.entrypoints).not.toContain('pkg/utils.go');
  });

  it('should detect route files', () => {
    const files: FileInfo[] = [
      { path: 'src/routes/api.ts', hash: 'abc', size: 100 },
      { path: 'src/routes/auth.ts', hash: 'def', size: 100 },
      { path: 'src/utils.ts', hash: 'ghi', size: 100 },
    ];

    const facts = extractFacts(files, 300);

    expect(facts.routes.length).toBe(2);
    expect(facts.routes).toContain('src/routes/api.ts');
    expect(facts.routes).toContain('src/routes/auth.ts');
  });

  it('should detect controller files', () => {
    const files: FileInfo[] = [
      { path: 'src/controllers/UserController.ts', hash: 'abc', size: 100 },
      { path: 'src/handlers/AuthHandler.ts', hash: 'def', size: 100 },
    ];

    const facts = extractFacts(files, 200);

    expect(facts.controllers.length).toBeGreaterThan(0);
  });

  it('should detect service files', () => {
    const files: FileInfo[] = [
      { path: 'src/services/UserService.ts', hash: 'abc', size: 100 },
      { path: 'src/services/EmailService.ts', hash: 'def', size: 100 },
    ];

    const facts = extractFacts(files, 200);

    expect(facts.services.length).toBe(2);
  });

  it('should detect database migration folders', () => {
    const files: FileInfo[] = [
      { path: 'db/migrations/001_init.sql', hash: 'abc', size: 100 },
      { path: 'db/migrations/002_users.sql', hash: 'def', size: 100 },
      { path: 'prisma/migrations/20230101_init/migration.sql', hash: 'ghi', size: 100 },
    ];

    const facts = extractFacts(files, 300);

    expect(facts.dbMigrations.length).toBe(3);
  });

  it('should detect job and worker files', () => {
    const files: FileInfo[] = [
      { path: 'src/jobs/EmailJob.ts', hash: 'abc', size: 100 },
      { path: 'src/workers/ProcessWorker.ts', hash: 'def', size: 100 },
    ];

    const facts = extractFacts(files, 200);

    expect(facts.jobs.length).toBeGreaterThan(0);
    expect(facts.workers.length).toBeGreaterThan(0);
  });

  it('should detect test files and folders', () => {
    const files: FileInfo[] = [
      { path: 'tests/unit/user.test.ts', hash: 'abc', size: 100 },
      { path: 'src/__tests__/api.spec.ts', hash: 'def', size: 100 },
      { path: 'test_utils.py', hash: 'ghi', size: 100 },
      { path: 'pkg/utils_test.go', hash: 'jkl', size: 100 },
    ];

    const facts = extractFacts(files, 400);

    expect(facts.tests.length).toBe(4);
  });

  it('should include total file count and size', () => {
    const files: FileInfo[] = [
      { path: 'src/index.ts', hash: 'abc', size: 100 },
      { path: 'src/utils.ts', hash: 'def', size: 200 },
    ];

    const facts = extractFacts(files, 300);

    expect(facts.totalFiles).toBe(2);
    expect(facts.totalSize).toBe(300);
  });

  it('should handle empty file list', () => {
    const facts = extractFacts([], 0);

    expect(facts.languages).toHaveLength(0);
    expect(facts.configs).toHaveLength(0);
    expect(facts.entrypoints).toHaveLength(0);
    expect(facts.totalFiles).toBe(0);
    expect(facts.totalSize).toBe(0);
  });

  it('should sort languages by file count descending', () => {
    const files: FileInfo[] = [
      { path: 'file1.py', hash: 'a', size: 100 },
      { path: 'file2.ts', hash: 'b', size: 100 },
      { path: 'file3.ts', hash: 'c', size: 100 },
      { path: 'file4.ts', hash: 'd', size: 100 },
    ];

    const facts = extractFacts(files, 400);

    expect(facts.languages[0].language).toBe('TypeScript');
    expect(facts.languages[0].fileCount).toBe(3);
    expect(facts.languages[1].language).toBe('Python');
    expect(facts.languages[1].fileCount).toBe(1);
  });
});
