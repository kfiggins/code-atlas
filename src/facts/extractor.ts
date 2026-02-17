import { extname, basename, dirname } from 'path';
import type { FileInfo } from '../types.js';
import type { Facts, LanguageInfo, ConfigFile } from './types.js';

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.c': 'C',
  '.swift': 'Swift',
  '.m': 'Objective-C',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.json': 'JSON',
  '.toml': 'TOML',
  '.md': 'Markdown',
  '.sql': 'SQL',
};

const CONFIG_PATTERNS: Array<{ pattern: RegExp | string; type: string }> = [
  { pattern: 'package.json', type: 'npm' },
  { pattern: 'package-lock.json', type: 'npm' },
  { pattern: 'yarn.lock', type: 'yarn' },
  { pattern: 'pnpm-lock.yaml', type: 'pnpm' },
  { pattern: 'bun.lockb', type: 'bun' },
  { pattern: 'Dockerfile', type: 'docker' },
  { pattern: /docker-compose\.ya?ml/, type: 'docker-compose' },
  { pattern: 'pyproject.toml', type: 'python' },
  { pattern: 'requirements.txt', type: 'python' },
  { pattern: 'Pipfile', type: 'python' },
  { pattern: 'poetry.lock', type: 'python' },
  { pattern: 'go.mod', type: 'go' },
  { pattern: 'go.sum', type: 'go' },
  { pattern: 'Cargo.toml', type: 'rust' },
  { pattern: 'Cargo.lock', type: 'rust' },
  { pattern: 'pom.xml', type: 'maven' },
  { pattern: 'build.gradle', type: 'gradle' },
  { pattern: 'tsconfig.json', type: 'typescript' },
  { pattern: 'vite.config.ts', type: 'vite' },
  { pattern: 'webpack.config.js', type: 'webpack' },
  { pattern: '.env', type: 'env' },
  { pattern: '.env.example', type: 'env' },
  { pattern: /terraform\.tfvars/, type: 'terraform' },
  { pattern: /\.tf$/, type: 'terraform' },
  { pattern: /k8s\/.*\.ya?ml/, type: 'kubernetes' },
  { pattern: /\.kube\//, type: 'kubernetes' },
];

const ENTRYPOINT_PATTERNS = [
  // Node.js
  /^src\/index\.(ts|js)$/,
  /^index\.(ts|js)$/,
  /^src\/main\.(ts|js)$/,
  /^main\.(ts|js)$/,
  /^src\/server\.(ts|js)$/,
  /^server\.(ts|js)$/,
  /^src\/app\.(ts|js)$/,
  /^app\.(ts|js)$/,

  // Python
  /^main\.py$/,
  /^app\.py$/,
  /^__main__\.py$/,
  /^manage\.py$/, // Django

  // Go
  /^cmd\/.*\/main\.go$/,
  /^main\.go$/,
];

const ROUTE_PATTERNS = [
  /routes?\//i,
  /router\//i,
  /routing\//i,
  /endpoints?\//i,
];

const CONTROLLER_PATTERNS = [
  /controllers?\//i,
  /handlers?\//i,
];

const SERVICE_PATTERNS = [
  /services?\//i,
  /service-layer\//i,
];

const DB_MIGRATION_PATTERNS = [
  /migrations?\//i,
  /migrate\//i,
  /db\/migrate/i,
  /alembic\/versions/i, // Python Alembic
  /prisma\/migrations/i, // Prisma
];

const JOB_PATTERNS = [
  /jobs?\//i,
  /workers?\//i,
  /background\//i,
  /queues?\//i,
  /tasks?\//i,
];

const TEST_PATTERNS = [
  /^tests?\//i,
  /__tests__\//i,
  /\.test\.(ts|js|py|go)$/,
  /\.spec\.(ts|js|py)$/,
  /_test\.go$/,
  /test_.*\.py$/,
];

export class FactsExtractor {
  private files: FileInfo[];
  private totalSize: number;

  constructor(files: FileInfo[], totalSize: number) {
    this.files = files;
    this.totalSize = totalSize;
  }

  public extract(): Facts {
    return {
      languages: this.detectLanguages(),
      configs: this.detectConfigs(),
      entrypoints: this.detectEntrypoints(),
      routes: this.detectByPatterns(ROUTE_PATTERNS),
      controllers: this.detectByPatterns(CONTROLLER_PATTERNS),
      handlers: this.detectByPatterns(CONTROLLER_PATTERNS),
      services: this.detectByPatterns(SERVICE_PATTERNS),
      dbMigrations: this.detectByPatterns(DB_MIGRATION_PATTERNS),
      jobs: this.detectByPatterns(JOB_PATTERNS),
      workers: this.detectByPatterns(JOB_PATTERNS),
      tests: this.detectByPatterns(TEST_PATTERNS),
      totalFiles: this.files.length,
      totalSize: this.totalSize,
    };
  }

  private detectLanguages(): LanguageInfo[] {
    const languageCounts = new Map<string, number>();
    let codeFileCount = 0;

    for (const file of this.files) {
      const ext = extname(file.path).toLowerCase();
      const language = LANGUAGE_MAP[ext];

      if (language && !['YAML', 'JSON', 'TOML', 'Markdown'].includes(language)) {
        languageCounts.set(language, (languageCounts.get(language) || 0) + 1);
        codeFileCount++;
      }
    }

    const languages: LanguageInfo[] = Array.from(languageCounts.entries())
      .map(([language, fileCount]) => ({
        language,
        fileCount,
        percentage: Math.round((fileCount / codeFileCount) * 100),
      }))
      .sort((a, b) => b.fileCount - a.fileCount);

    return languages;
  }

  private detectConfigs(): ConfigFile[] {
    const configs: ConfigFile[] = [];

    for (const file of this.files) {
      const fileName = basename(file.path);
      const filePath = file.path;

      for (const { pattern, type } of CONFIG_PATTERNS) {
        let matches = false;

        if (typeof pattern === 'string') {
          matches = fileName === pattern;
        } else {
          matches = pattern.test(filePath);
        }

        if (matches) {
          configs.push({ type, path: filePath });
          break; // Only match first pattern
        }
      }
    }

    return configs;
  }

  private detectEntrypoints(): string[] {
    const entrypoints: string[] = [];

    for (const file of this.files) {
      for (const pattern of ENTRYPOINT_PATTERNS) {
        if (pattern.test(file.path)) {
          entrypoints.push(file.path);
          break;
        }
      }
    }

    return entrypoints;
  }

  private detectByPatterns(patterns: RegExp[]): string[] {
    const matches: string[] = [];

    for (const file of this.files) {
      for (const pattern of patterns) {
        if (pattern.test(file.path)) {
          matches.push(file.path);
          break;
        }
      }
    }

    return matches;
  }
}

export function extractFacts(files: FileInfo[], totalSize: number): Facts {
  const extractor = new FactsExtractor(files, totalSize);
  return extractor.extract();
}
