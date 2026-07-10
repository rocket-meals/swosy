import path from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { source as axeSource, version as axeCoreVersion } from 'axe-core';
import { APP_ROUTES, AppLinks, GlobalParams } from 'repo-depkit-common';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { AccessibilityReport, countViolationsByImpact, ImpactLevel, ScreenResult, ViolationSummary, writeBadge, writeJsonReport, writeMarkdownReport } from './report';

const argv = yargs(hideBin(process.argv))
  .option('baseUrl', {
    alias: 'u',
    description: 'Base URL of the running web app (e.g. http://localhost:8081 or http://localhost:8081/rocket-meals)',
    type: 'string',
    demandOption: false,
  })
  .option('reportDir', {
    alias: 'd',
    description: 'Directory to write the accessibility reports into',
    type: 'string',
    demandOption: false,
  })
  .option('browserLang', {
    alias: 'b',
    description: 'Language for the browser',
    type: 'string',
    demandOption: false,
  })
  .option('tags', {
    alias: 't',
    description: 'Comma separated axe-core rule tags to run',
    type: 'string',
    demandOption: false,
  })
  .option('failOnViolations', {
    alias: 'f',
    description: 'Exit with code 1 if critical or serious violations are found',
    type: 'boolean',
    demandOption: false,
  })
  .help()
  .alias('help', 'h').argv as any;

const baseUrl: string = (argv.baseUrl || process.env.BASE_URL || 'http://localhost:8081').replace(/\/$/, '');
// Default assumes the script is started from apps/accessibilityTester (yarn workspace / yarn start)
const reportDir: string = path.resolve(argv.reportDir || process.env.REPORT_DIR || path.join(process.cwd(), '../../reports/accessibility'));
const browserLang: string = argv.browserLang || process.env.BROWSER_LANG || 'de';
const tags: string[] = (argv.tags || process.env.AXE_TAGS || 'wcag2a,wcag2aa,wcag21a,wcag21aa,best-practice').split(',').map((tag: string) => tag.trim());
const failOnViolations: boolean = Boolean(argv.failOnViolations || process.env.FAIL_ON_VIOLATIONS);

const VIEWPORT = { width: 1280, height: 900 };
const PAGE_SETTLE_MS = 3000;
const PAGE_TIMEOUT_MS = 60000;

function buildScreenUrl(screen: string): string {
  const relativeUrl = AppLinks.build(screen, [{ key: GlobalParams.kioskMode, value: true }]);
  return `${baseUrl}/${relativeUrl}`;
}

function summarizeViolations(violations: any[]): ViolationSummary[] {
  return violations.map(violation => ({
    id: violation.id,
    // axe reports impact per node; the rule-level impact can be null in edge cases
    impact: (violation.impact ?? 'minor') as ImpactLevel,
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    wcagTags: (violation.tags ?? []).filter((tag: string) => tag.startsWith('wcag')),
    nodeCount: violation.nodes.length,
    nodes: violation.nodes.map((node: any) => ({
      target: Array.isArray(node.target) ? node.target.join(' ') : String(node.target),
      html: String(node.html ?? '').slice(0, 300),
      failureSummary: node.failureSummary,
    })),
  }));
}

async function analyzeScreen(browser: Browser, screen: string): Promise<ScreenResult> {
  const url = buildScreenUrl(screen);
  const page = await browser.newPage();
  try {
    await page.setViewport(VIEWPORT);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: PAGE_TIMEOUT_MS });
    // Give the app time to finish booting/animations after network idle
    await new Promise(resolve => setTimeout(resolve, PAGE_SETTLE_MS));

    const results = await new AxePuppeteer(page, axeSource).withTags(tags).analyze();

    return {
      screen,
      url,
      violations: summarizeViolations(results.violations),
      passCount: results.passes.length,
      incompleteCount: results.incomplete.length,
    };
  } catch (error: any) {
    console.error(`Error analyzing ${screen}: ${error.message}`);
    return { screen, url, error: error.message, violations: [], passCount: 0, incompleteCount: 0 };
  } finally {
    await page.close().catch(() => undefined);
  }
}

(async () => {
  console.log(`Running accessibility audit against ${baseUrl}`);
  console.log(`Rule tags: ${tags.join(', ')}`);
  console.log(`Report directory: ${reportDir}`);
  console.log(`Screens to analyze: ${APP_ROUTES.length}`);

  const browser = await puppeteer.launch({
    args: [`--lang=${browserLang}`, '--no-sandbox', '--disable-setuid-sandbox'],
  });

  const screens: ScreenResult[] = [];
  let current = 0;
  for (const screen of APP_ROUTES) {
    current++;
    console.log(`[${current}/${APP_ROUTES.length}] Analyzing ${screen} ...`);
    const result = await analyzeScreen(browser, screen);
    const violationElementCount = result.violations.reduce((sum, violation) => sum + violation.nodeCount, 0);
    console.log(result.error ? `  ⚠️ error: ${result.error}` : `  ${violationElementCount} violation element(s), ${result.passCount} passed rules`);
    screens.push(result);
  }

  await browser.close();

  const report: AccessibilityReport = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    axeCoreVersion,
    tags,
    viewport: VIEWPORT,
    totals: countViolationsByImpact(screens),
    screens,
  };

  await writeJsonReport(report, reportDir);
  await writeMarkdownReport(report, reportDir);
  await writeBadge(report, reportDir);

  console.log('---');
  console.log(`Total violations (affected elements): ${report.totals.violations}`);
  console.log(`  critical: ${report.totals.critical}, serious: ${report.totals.serious}, moderate: ${report.totals.moderate}, minor: ${report.totals.minor}`);
  if (report.totals.screensWithErrors > 0) {
    console.log(`  screens with load errors: ${report.totals.screensWithErrors}`);
  }

  if (failOnViolations && report.totals.critical + report.totals.serious > 0) {
    console.error('Failing because critical/serious violations were found (--failOnViolations).');
    process.exit(1);
  }
})();
