import fs from 'fs';
import fetch from 'node-fetch';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { execSync } from 'child_process';
import { IssueData } from './IssueData';
import { StringHelper } from 'repo-depkit-common';

type Issue = IssueData;

// Mapping von Impact Software Qualities zu Report-Namen
const qualityToReportName: Record<string, string> = {
  SECURITY: 'security',
  RELIABILITY: 'reliability',
  MAINTAINABILITY: 'maintainability',
};

function getRepoRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    console.warn('Could not determine git repository root. Using current directory.');
    return process.cwd();
  }
}

const repoRoot = getRepoRoot();

const argv = yargs(hideBin(process.argv))
  .scriptName('sonar-report')
  .usage('$0 [args]')
  .option('token', {
    alias: 't',
    type: 'string',
    demandOption: true,
    describe: 'SonarCloud API token',
  })
  .option('project', {
    alias: 'p',
    type: 'string',
    demandOption: true,
    describe: 'SonarCloud project key',
  })
  .option('qualities', {
    alias: 'q',
    type: 'array',
    choices: ['SECURITY', 'RELIABILITY', 'MAINTAINABILITY'],
    default: ['SECURITY', 'RELIABILITY', 'MAINTAINABILITY'],
    describe: 'Impact Software Qualities to download (default: all qualities)',
  })
  .option('output-dir', {
    alias: 'o',
    type: 'string',
    default: path.join(repoRoot, 'reports', 'sonarCloud'),
    describe: 'Output directory for reports',
  })
  .help()
  .alias('h', 'help').argv as any;

async function fetchAllIssues(token: string, project: string, quality: string): Promise<Issue[]> {
  let page = 1;
  const pageSize = 500;
  let issues: Issue[] = [];
  let total = 0;

  do {
    const url = `https://sonarcloud.io/api/issues/search?componentKeys=${encodeURIComponent(project)}&impactSoftwareQualities=${quality}&issueStatuses=OPEN,CONFIRMED&p=${page}&ps=${pageSize}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(token + ':').toString('base64')}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    total = data.paging.total;

    const batch: Issue[] = data.issues.map((i: any) => ({
      key: i.key,
      message: i.message,
      component: i.component,
      line: i.line,
    }));

    issues = issues.concat(batch);
    page++;
  } while (issues.length < total);

  return issues;
}

async function generateReport(token: string, project: string, quality: string, outputDir: string): Promise<void> {
  console.log(`Fetching ${quality} issues for project ${project}...`);
  const issues = await fetchAllIssues(token, project, quality);

  const reportName = qualityToReportName[quality];
  const outputFile = path.join(outputDir, `report_${reportName}.csv`);

  console.log(`Fetched ${issues.length} ${quality} issues. Writing to ${outputFile}...`);
  const header = 'Key,Message,Component,Line\n';
  const rows = issues.map(i => `"${i.key}","${StringHelper.replaceAllLiteralWithOptions({ str: i.message, find: '"', replace: '""' })}","${i.component}",${i.line ?? ''}`);

  // Stelle sicher, dass das Verzeichnis existiert
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, header + rows.join('\n'), 'utf-8');

  console.log(`✅ ${quality} report saved to ${outputFile}`);
}

async function main() {
  const { token, project, qualities, 'output-dir': outputDir } = argv;
  const resolvedOutputDir = path.resolve(outputDir);

  console.log(`Generating reports for project ${project}...`);
  console.log(`Impact Software Qualities: ${qualities.join(', ')}`);
  console.log(`Output directory: ${resolvedOutputDir}`);

  for (const quality of qualities) {
    await generateReport(token, project, quality, resolvedOutputDir);
  }

  console.log('All reports generated successfully ✅');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
