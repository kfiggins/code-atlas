import { spawnSync } from 'child_process';
import { relative } from 'path';
import type { FileInfo } from '../types.js';

export interface FeatureFindResult {
  matchingFiles: string[];
  expandedFiles: string[];
}

export class FeatureFinder {
  private repoRoot: string;
  private query: string;

  constructor(repoRoot: string, query: string) {
    this.repoRoot = repoRoot;
    this.query = query;
  }

  /**
   * Find files related to a feature using ripgrep
   */
  public findFeatureFiles(): FeatureFindResult {
    const matchingFiles = this.searchWithRipgrep();
    const expandedFiles = this.expandRelatedFiles(matchingFiles);

    return {
      matchingFiles,
      expandedFiles: [...new Set([...matchingFiles, ...expandedFiles])],
    };
  }

  private searchWithRipgrep(): string[] {
    try {
      // Try to use ripgrep (rg) if available
      const result = spawnSync('rg', [
        '--files-with-matches',
        '--ignore-case',
        '--type-not', 'lock',
        '--glob', '!node_modules',
        '--glob', '!dist',
        '--glob', '!build',
        '--glob', '!.git',
        this.query,
        this.repoRoot,
      ], {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      if (result.status === 0 && result.stdout) {
        return result.stdout
          .trim()
          .split('\n')
          .filter(line => line.length > 0)
          .map(fullPath => relative(this.repoRoot, fullPath));
      }

      // Fallback: if rg not found, use simple grep
      return this.fallbackSearch();
    } catch (error) {
      // Ripgrep not available, use fallback
      return this.fallbackSearch();
    }
  }

  private fallbackSearch(): string[] {
    // Simple fallback using grep (less capable but widely available)
    try {
      const result = spawnSync('grep', [
        '-r',
        '-i',
        '-l',
        '--exclude-dir=node_modules',
        '--exclude-dir=dist',
        '--exclude-dir=build',
        '--exclude-dir=.git',
        this.query,
        this.repoRoot,
      ], {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });

      if (result.stdout) {
        return result.stdout
          .trim()
          .split('\n')
          .filter(line => line.length > 0)
          .map(fullPath => relative(this.repoRoot, fullPath));
      }
    } catch {
      // Grep also not available or failed
    }

    return [];
  }

  private expandRelatedFiles(matchingFiles: string[]): string[] {
    const related: string[] = [];

    // Heuristic patterns for related files
    const routePatterns = ['/routes/', '/router/', '/endpoints/'];
    const controllerPatterns = ['/controllers/', '/handlers/'];
    const servicePatterns = ['/services/', '/service-layer/'];

    for (const file of matchingFiles) {
      const dirPath = file.substring(0, file.lastIndexOf('/'));

      // If a matching file is in a specific domain folder, include nearby files
      for (const pattern of [...routePatterns, ...controllerPatterns, ...servicePatterns]) {
        if (file.includes(pattern)) {
          // This is a heuristic - in a real implementation, we'd parse imports
          // For now, just flag that we found feature-related files
          break;
        }
      }
    }

    return related;
  }

  /**
   * Filter files to only feature-related ones
   */
  public filterToFeatureFiles(allFiles: FileInfo[], featureResult: FeatureFindResult): FileInfo[] {
    const featurePathSet = new Set(featureResult.expandedFiles);

    return allFiles.filter(file => featurePathSet.has(file.path));
  }
}
