import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { FileCollector } from '../../src/core/file-collector.js';
import type { CollectionOptions } from '../../src/types.js';

describe('FileCollector', () => {
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'test-repo-collector');

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

  const createTestFiles = () => {
    // Create various test files
    writeFileSync(join(testDir, 'README.md'), '# Test Repo', 'utf-8');
    writeFileSync(join(testDir, 'package.json'), '{}', 'utf-8');
    writeFileSync(join(testDir, 'index.ts'), 'console.log("hello")', 'utf-8');

    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'main.ts'), 'export {}', 'utf-8');
    writeFileSync(join(testDir, 'src', 'utils.ts'), 'export {}', 'utf-8');

    mkdirSync(join(testDir, 'node_modules', 'pkg'), { recursive: true });
    writeFileSync(join(testDir, 'node_modules', 'pkg', 'index.js'), '// package', 'utf-8');

    mkdirSync(join(testDir, 'dist'), { recursive: true });
    writeFileSync(join(testDir, 'dist', 'bundle.js'), '// built', 'utf-8');
  };

  it('should collect files from repo', () => {
    createTestFiles();

    const options: CollectionOptions = {
      scope: { type: 'repo', value: 'repo' },
      maxFiles: 100,
      maxFileSizeBytes: 200 * 1024,
      ignorePatterns: ['node_modules', 'dist'],
      binaryExtensions: ['.png', '.jpg'],
    };

    const collector = new FileCollector(testDir, options);
    const result = collector.collect();

    expect(result.files.length).toBeGreaterThan(0);
    expect(result.files.length).toBeLessThanOrEqual(100);

    // Check that ignored files are not included
    const paths = result.files.map(f => f.path);
    expect(paths.every(p => !p.includes('node_modules'))).toBe(true);
    expect(paths.every(p => !p.includes('dist'))).toBe(true);
  });

  it('should respect .gitignore', () => {
    createTestFiles();

    // Create .gitignore
    writeFileSync(join(testDir, '.gitignore'), 'dist/\n*.log\n', 'utf-8');
    writeFileSync(join(testDir, 'test.log'), 'logs', 'utf-8');

    const options: CollectionOptions = {
      scope: { type: 'repo', value: 'repo' },
      maxFiles: 100,
      maxFileSizeBytes: 200 * 1024,
      ignorePatterns: ['node_modules'],
      binaryExtensions: ['.png', '.jpg'],
    };

    const collector = new FileCollector(testDir, options);
    const result = collector.collect();

    const paths = result.files.map(f => f.path);
    expect(paths.every(p => !p.includes('dist'))).toBe(true);
    expect(paths.every(p => !p.endsWith('.log'))).toBe(true);
  });

  it('should exclude binary files', () => {
    createTestFiles();

    // Create binary files
    mkdirSync(join(testDir, 'images'), { recursive: true });
    writeFileSync(join(testDir, 'images', 'logo.png'), Buffer.from([0, 1, 2, 3]));
    writeFileSync(join(testDir, 'images', 'photo.jpg'), Buffer.from([0, 1, 2, 3]));

    const options: CollectionOptions = {
      scope: { type: 'repo', value: 'repo' },
      maxFiles: 100,
      maxFileSizeBytes: 200 * 1024,
      ignorePatterns: ['node_modules', 'dist'],
      binaryExtensions: ['.png', '.jpg', '.jpeg'],
    };

    const collector = new FileCollector(testDir, options);
    const result = collector.collect();

    const paths = result.files.map(f => f.path);
    expect(paths.every(p => !p.endsWith('.png'))).toBe(true);
    expect(paths.every(p => !p.endsWith('.jpg'))).toBe(true);
  });

  it('should respect file size limit', () => {
    createTestFiles();

    // Create a large file
    const largeContent = 'x'.repeat(300 * 1024); // 300KB
    writeFileSync(join(testDir, 'large.txt'), largeContent, 'utf-8');

    const options: CollectionOptions = {
      scope: { type: 'repo', value: 'repo' },
      maxFiles: 100,
      maxFileSizeBytes: 200 * 1024, // 200KB limit
      ignorePatterns: ['node_modules', 'dist'],
      binaryExtensions: ['.png', '.jpg'],
    };

    const collector = new FileCollector(testDir, options);
    const result = collector.collect();

    const paths = result.files.map(f => f.path);
    expect(paths.includes('large.txt')).toBe(false);
  });

  it('should respect file count limit', () => {
    createTestFiles();

    // Create many files
    for (let i = 0; i < 50; i++) {
      writeFileSync(join(testDir, `file${i}.txt`), `content ${i}`, 'utf-8');
    }

    const options: CollectionOptions = {
      scope: { type: 'repo', value: 'repo' },
      maxFiles: 10,
      maxFileSizeBytes: 200 * 1024,
      ignorePatterns: ['node_modules', 'dist'],
      binaryExtensions: ['.png', '.jpg'],
    };

    const collector = new FileCollector(testDir, options);
    const result = collector.collect();

    expect(result.files.length).toBeLessThanOrEqual(10);
    expect(result.skippedFiles.length).toBeGreaterThan(0);
  });

  it('should collect files from folder scope', () => {
    createTestFiles();

    const options: CollectionOptions = {
      scope: { type: 'folder', value: 'src' },
      maxFiles: 100,
      maxFileSizeBytes: 200 * 1024,
      ignorePatterns: ['node_modules', 'dist'],
      binaryExtensions: ['.png', '.jpg'],
    };

    const collector = new FileCollector(testDir, options);
    const result = collector.collect();

    const paths = result.files.map(f => f.path);
    expect(paths.every(p => p.startsWith('src'))).toBe(true);
  });

  it('should create SHA256 hashes for files', () => {
    createTestFiles();

    const options: CollectionOptions = {
      scope: { type: 'repo', value: 'repo' },
      maxFiles: 100,
      maxFileSizeBytes: 200 * 1024,
      ignorePatterns: ['node_modules', 'dist'],
      binaryExtensions: ['.png', '.jpg'],
    };

    const collector = new FileCollector(testDir, options);
    const result = collector.collect();

    expect(result.files.length).toBeGreaterThan(0);
    expect(result.files.every(f => f.hash.length === 64)).toBe(true); // SHA256 is 64 hex chars
    expect(result.files.every(f => /^[a-f0-9]+$/i.test(f.hash))).toBe(true);
  });

  it('should include file size in results', () => {
    createTestFiles();

    const options: CollectionOptions = {
      scope: { type: 'repo', value: 'repo' },
      maxFiles: 100,
      maxFileSizeBytes: 200 * 1024,
      ignorePatterns: ['node_modules', 'dist'],
      binaryExtensions: ['.png', '.jpg'],
    };

    const collector = new FileCollector(testDir, options);
    const result = collector.collect();

    expect(result.files.every(f => f.size >= 0)).toBe(true);
    expect(result.totalSize).toBeGreaterThan(0);
  });
});
