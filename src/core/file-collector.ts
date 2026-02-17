import { readFileSync, statSync, existsSync, readdirSync } from 'fs';
import { join, relative, extname } from 'path';
import ignore from 'ignore';
import type { CollectionOptions, CollectionResult, FileInfo } from '../types.js';
import { createHash } from 'crypto';

export class FileCollector {
  private ig: ReturnType<typeof ignore>;
  private options: CollectionOptions;
  private repoRoot: string;

  constructor(repoRoot: string, options: CollectionOptions) {
    this.repoRoot = repoRoot;
    this.options = options;
    this.ig = ignore();

    // Load .gitignore if it exists
    this.loadGitignore();

    // Add default ignore patterns
    this.ig.add(options.ignorePatterns);

    // Add user exclude patterns
    if (options.excludePatterns) {
      this.ig.add(options.excludePatterns);
    }
  }

  private loadGitignore(): void {
    const gitignorePath = join(this.repoRoot, '.gitignore');
    if (existsSync(gitignorePath)) {
      const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
      this.ig.add(gitignoreContent);
    }
  }

  private isBinaryFile(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return this.options.binaryExtensions.includes(ext);
  }

  private isFileTooLarge(filePath: string): boolean {
    try {
      const stats = statSync(filePath);
      return stats.size > this.options.maxFileSizeBytes;
    } catch {
      return true; // Skip files we can't stat
    }
  }

  private shouldIncludeFile(filePath: string): boolean {
    const relativePath = relative(this.repoRoot, filePath);

    // Check if ignored
    if (this.ig.ignores(relativePath)) {
      return false;
    }

    // Check if binary
    if (this.isBinaryFile(filePath)) {
      return false;
    }

    // Check size
    if (this.isFileTooLarge(filePath)) {
      return false;
    }

    // Check include patterns if specified
    if (this.options.includePatterns && this.options.includePatterns.length > 0) {
      const matches = this.options.includePatterns.some(pattern => {
        // Simple glob matching (just suffix for now)
        if (pattern.startsWith('*.')) {
          return filePath.endsWith(pattern.slice(1));
        }
        return filePath.includes(pattern);
      });
      if (!matches) {
        return false;
      }
    }

    return true;
  }

  private calculateHash(filePath: string): string {
    try {
      const content = readFileSync(filePath);
      return createHash('sha256').update(content).digest('hex');
    } catch (error) {
      console.warn(`Failed to hash ${filePath}:`, error);
      return '';
    }
  }

  private walkDirectory(dir: string, files: string[] = []): string[] {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = relative(this.repoRoot, fullPath);

        // Skip if ignored
        if (this.ig.ignores(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          this.walkDirectory(fullPath, files);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${dir}:`, error);
    }

    return files;
  }

  public collect(): CollectionResult {
    const allFiles: string[] = [];
    const skippedFiles: string[] = [];
    const collectedFiles: FileInfo[] = [];
    let totalSize = 0;

    // Determine starting path based on scope
    const startPath = this.options.scope.type === 'repo'
      ? this.repoRoot
      : this.options.scope.type === 'folder'
      ? join(this.repoRoot, this.options.scope.value)
      : this.repoRoot;

    // Walk directory tree
    this.walkDirectory(startPath, allFiles);

    // Filter and collect files
    for (const filePath of allFiles) {
      // Check if we've hit the max file count
      if (collectedFiles.length >= this.options.maxFiles) {
        skippedFiles.push(filePath);
        continue;
      }

      if (!this.shouldIncludeFile(filePath)) {
        skippedFiles.push(filePath);
        continue;
      }

      try {
        const stats = statSync(filePath);
        const hash = this.calculateHash(filePath);

        if (hash) {
          collectedFiles.push({
            path: relative(this.repoRoot, filePath),
            hash,
            size: stats.size,
          });
          totalSize += stats.size;
        }
      } catch (error) {
        console.warn(`Failed to process ${filePath}:`, error);
        skippedFiles.push(filePath);
      }
    }

    // For repo scope, sample files if we have too many
    if (this.options.scope.type === 'repo' && collectedFiles.length > this.options.maxFiles) {
      const sampled = this.sampleFiles(collectedFiles, this.options.maxFiles);
      const removed = collectedFiles.filter(f => !sampled.includes(f));
      skippedFiles.push(...removed.map(f => f.path));
      return {
        files: sampled,
        skippedFiles,
        totalSize: sampled.reduce((sum, f) => sum + f.size, 0),
      };
    }

    return {
      files: collectedFiles,
      skippedFiles,
      totalSize,
    };
  }

  private sampleFiles(files: FileInfo[], maxCount: number): FileInfo[] {
    // Priority sampling: prefer important files
    const important: FileInfo[] = [];
    const normal: FileInfo[] = [];

    const importantPatterns = [
      'readme',
      'package.json',
      'dockerfile',
      'docker-compose',
      'main.',
      'index.',
      'app.',
      'server.',
      'config',
    ];

    for (const file of files) {
      const lowerPath = file.path.toLowerCase();
      if (importantPatterns.some(pattern => lowerPath.includes(pattern))) {
        important.push(file);
      } else {
        normal.push(file);
      }
    }

    // Take all important files, then sample from normal
    const result = [...important];
    const remaining = maxCount - result.length;

    if (remaining > 0 && normal.length > 0) {
      // Take evenly distributed samples from normal files
      const step = Math.max(1, Math.floor(normal.length / remaining));
      for (let i = 0; i < normal.length && result.length < maxCount; i += step) {
        result.push(normal[i]);
      }
    }

    return result.slice(0, maxCount);
  }
}
