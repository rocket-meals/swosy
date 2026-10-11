import * as path from 'node:path';
import * as fs from 'node:fs';

function findFileUpwards(startDir: string, filename: string): Promise<string | null> {
  let currentDir = startDir;

  while (true) {
    const potentialPath = path.join(currentDir, filename);
    if (fs.existsSync(potentialPath)) {
      return Promise.resolve(potentialPath);
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached the root directory
    }
    currentDir = parentDir;
  }

  return Promise.resolve(null);
}

export async function findEnvFile(): Promise<string | null> {
  const startDir = process.cwd();
  return findFileUpwards(startDir, '.env');
}

export async function findProjectRootFile(): Promise<string | null> {
  const startDir = process.cwd();
  return findFileUpwards(startDir, 'PROJECT_ROOT.md');
}