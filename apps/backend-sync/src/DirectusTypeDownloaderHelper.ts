import { chromium } from 'playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface DirectusTypeDownloaderOptions {
  directusInstanceUrl: string;
  adminEmail: string;
  adminPassword: string;
  targetTypesFilePath: string;
}

export class DirectusTypeDownloaderHelper {
  private readonly options: DirectusTypeDownloaderOptions;

  constructor(options: DirectusTypeDownloaderOptions) {
    this.options = options;
  }

  public async downloadTypes(): Promise<void> {
    const { directusInstanceUrl, adminEmail, adminPassword, targetTypesFilePath } = this.options;

    const loginUrl = `${directusInstanceUrl}/admin/login`;
    const generateTypesUrl = `${directusInstanceUrl}/admin/generate-types/ts`;

    console.log('🌐 Starte Browser für TypeScript-Typen-Download...');
    console.log(`📡 Ziel-URL: ${generateTypesUrl}`);

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
      });
      const page = await context.newPage();

      // Login
      console.log(`🔐 Navigiere zur Login-Seite: ${loginUrl}`);
      await page.goto(loginUrl, { waitUntil: 'networkidle' });

      console.log('✏️  Fülle Login-Formular aus...');
      await page.fill('input[type="email"], input[name="email"], #email', adminEmail);
      await page.fill('input[type="password"], input[name="password"], #password', adminPassword);
      await page.click('button[type="submit"], [type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Anmelden")');

      console.log('⏳ Warte auf erfolgreichen Login...');
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
      console.log('✅ Erfolgreich eingeloggt');

      // Navigate to generate-types page
      console.log(`🔗 Navigiere zur Typen-Generierungs-Seite: ${generateTypesUrl}`);
      await page.goto(generateTypesUrl, { waitUntil: 'networkidle' });

      // Wait for page to load
      console.log('⏳ Warte 5 Sekunden auf vollständiges Laden der Seite...');
      await page.waitForTimeout(5000);

      // Click Download button and capture the download
      console.log('📥 Klicke Download-Button...');
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("Download"), a:has-text("Download"), [data-test="download"], .download-button'),
      ]);

      console.log('💾 Speichere heruntergeladene Datei...');
      const downloadPath = await download.path();
      if (!downloadPath) {
        throw new Error('Download fehlgeschlagen – kein Dateipfad erhalten');
      }

      const targetDir = path.dirname(targetTypesFilePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.copyFileSync(downloadPath, targetTypesFilePath);
      console.log(`✅ TypeScript-Typen erfolgreich gespeichert: ${targetTypesFilePath}`);
    } finally {
      await browser.close();
    }
  }
}
