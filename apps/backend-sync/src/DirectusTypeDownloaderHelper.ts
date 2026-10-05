import { chromium, type Page } from 'playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DirectusConnectionOptions } from './DirectusConnectionOptions';

const EMAIL_INPUT_SELECTOR = 'input[type="email"], input[name="email"], #email';
const PASSWORD_INPUT_SELECTOR = 'input[type="password"], input[name="password"], #password';
const SUBMIT_BUTTON_SELECTOR = 'button[type="submit"], [type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Anmelden")';
// The generate-types module (npm `directus-extension-generate-types`) renders its button as
// `<div class="v-button downloadBtn"><button>…</button></div>`. The label comes from the Studio's
// i18n ("Download", "Herunterladen", …) and follows the admin's / project's language, so the
// class selector comes first; the text selectors are only a fallback.
const DOWNLOAD_BUTTON_SELECTOR = '.downloadBtn button, button:has-text("Download"), button:has-text("Herunterladen"), a:has-text("Download"), [data-test="download"], .download-button';
// Code block of the module; it only contains a <pre> once the types have been generated.
const GENERATED_CODE_SELECTOR = '.generate-types-textarea pre';
// Directus >= 11.x shows a "Set project owner" dialog to admins as long as no project owner is
// configured. It overlays the whole Studio and hides the Download button from Playwright.
const PROJECT_OWNER_DIALOG_DISMISS_SELECTOR = '.v-card-actions button:has-text("Remind Later")';

export interface DirectusTypeDownloaderOptions extends DirectusConnectionOptions {
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
      await page.fill(EMAIL_INPUT_SELECTOR, adminEmail);
      await page.fill(PASSWORD_INPUT_SELECTOR, adminPassword);
      await page.click(SUBMIT_BUTTON_SELECTOR);

      console.log('⏳ Warte auf erfolgreichen Login...');
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
      console.log('✅ Erfolgreich eingeloggt');

      // Navigate to generate-types page
      console.log(`🔗 Navigiere zur Typen-Generierungs-Seite: ${generateTypesUrl}`);
      await page.goto(generateTypesUrl, { waitUntil: 'networkidle' });

      await this.dismissProjectOwnerDialogIfShown(page);

      // Wait for the Download button to be visible (up to 30 seconds)
      console.log('⏳ Warte auf Download-Button...');
      await page.waitForSelector(DOWNLOAD_BUTTON_SELECTOR, { state: 'visible', timeout: 30000 });

      // The button is visible immediately, while the types are still being generated in the
      // browser. Wait until the code block shows generated types and the button is enabled,
      // otherwise an empty or partial file would be downloaded.
      console.log('⏳ Warte bis die Typen generiert sind und der Download-Button aktiviert ist...');
      await page.waitForFunction(
        ({ codeSelector }) => {
          const code = document.querySelector(codeSelector);
          if (!code?.textContent?.includes('export type')) {
            return false;
          }
          const el =
            document.querySelector('.downloadBtn button') ??
            Array.from(document.querySelectorAll('button, a')).find(b => {
              const text = b.textContent?.trim().toLowerCase() ?? '';
              return text.includes('download') || text.includes('herunterladen');
            });
          return !!el && !(el as HTMLButtonElement).disabled && !el.hasAttribute('disabled');
        },
        { codeSelector: GENERATED_CODE_SELECTOR },
        { timeout: 60000 }
      );

      // Click Download button and capture the download
      console.log('📥 Klicke Download-Button...');
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator(DOWNLOAD_BUTTON_SELECTOR).first().click(),
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

  private async dismissProjectOwnerDialogIfShown(page: Page): Promise<void> {
    const dismissButton = page.locator(PROJECT_OWNER_DIALOG_DISMISS_SELECTOR).first();
    try {
      await dismissButton.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      return; // no dialog shown (project owner is set)
    }
    console.log('ℹ️  Schließe "Set project owner"-Dialog (Remind Later)...');
    await dismissButton.click();
    await dismissButton.waitFor({ state: 'hidden', timeout: 10000 });
  }
}
