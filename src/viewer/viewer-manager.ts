import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function copyViewerToOutput(outputDir: string): void {
  const viewerSource = join(__dirname, 'index.html');
  const viewerDest = join(outputDir, 'index.html');

  if (!existsSync(viewerSource)) {
    throw new Error(`Viewer template not found at ${viewerSource}`);
  }

  const content = readFileSync(viewerSource, 'utf-8');
  writeFileSync(viewerDest, content, 'utf-8');
}

export function openViewer(viewerPath: string): void {
  // Determine the command to open the browser based on the platform
  const platform = process.platform;
  let command: string;
  let args: string[];

  if (platform === 'darwin') {
    // macOS
    command = 'open';
    args = [viewerPath];
  } else if (platform === 'win32') {
    // Windows
    command = 'cmd';
    args = ['/c', 'start', viewerPath];
  } else {
    // Linux
    command = 'xdg-open';
    args = [viewerPath];
  }

  spawn(command, args, { detached: true, stdio: 'ignore' }).unref();
}

export function findScopes(repoRoot: string): string[] {
  const repoexplainDir = join(repoRoot, '.repoexplain');

  if (!existsSync(repoexplainDir)) {
    return [];
  }

  return readdirSync(repoexplainDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

export function getMostRecentScope(repoRoot: string): string | null {
  const scopes = findScopes(repoRoot);

  if (scopes.length === 0) {
    return null;
  }

  // Find the most recently modified scope by checking manifest timestamps
  let mostRecentScope = scopes[0];
  let mostRecentTime = 0;

  for (const scopeId of scopes) {
    const manifestPath = join(repoRoot, '.repoexplain', scopeId, 'manifest.json');

    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        const timestamp = new Date(manifest.timestamp).getTime();

        if (timestamp > mostRecentTime) {
          mostRecentTime = timestamp;
          mostRecentScope = scopeId;
        }
      } catch {
        // Skip invalid manifests
      }
    }
  }

  return mostRecentScope;
}
