import { PdfGeneratorOptions } from "./PdfGeneratorHelper";
import { default as puppeteerCore } from "puppeteer-core";

export class PuppeteerGenerator {
    public static PuppeteerCore: any = puppeteerCore;
    public static PuppeteerForJest: any = undefined;

    public static getPuppeteerLib() {
        return this.PuppeteerForJest || this.PuppeteerCore;
    }

    static async generatePdfFromHtmlPuppeteer(html: string, options: PdfGeneratorOptions): Promise<Buffer> {
        let browser;
        console.log("generatePdfFromHtmlPuppeteer");

        let puppeteer = PuppeteerGenerator.getPuppeteerLib();

        // Erkennen, ob Code in Docker läuft
        let isInsideDocker = !process.env.JEST_WORKER_ID; // Falls Jest gesetzt ist, dann ist es ein lokaler Test
        console.log("isInsideDocker:", isInsideDocker);

        // Setzt den ausführbaren Pfad für Chrome (statt Chromium)
        let executablePath = isInsideDocker ? "/usr/bin/chromium" : undefined;

        try {
            browser = await puppeteer.launch({
                executablePath,
                headless: true,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--disable-software-rasterizer",
                    "--disable-vulkan",
                    "--disable-extensions",
                    "--disable-background-networking",
                    "--disable-breakpad",
                    "--disable-client-side-phishing-detection",
                    "--disable-component-update",
                    "--disable-default-apps",
                    "--disable-hang-monitor",
                    "--disable-ipc-flooding-protection",
                    "--disable-popup-blocking",
                    "--disable-prompt-on-repost",
                    "--disable-sync",
                    "--disable-translate",
                    "--disable-logging",
                    "--metrics-recording-only",
                    "--mute-audio",
                    "--no-first-run",
                    "--safebrowsing-disable-auto-update",
                    "--single-process",
                    "--no-zygote",
                    "--disable-features=AudioServiceOutOfProcess"
                ]
            });

            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: "networkidle0" });

            const pdfUint8Array = await page.pdf(options);
            return Buffer.from(pdfUint8Array);
        } catch (error) {
            console.error("Error generating PDF:", error);
            throw new Error("Failed to generate PDF");
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}
