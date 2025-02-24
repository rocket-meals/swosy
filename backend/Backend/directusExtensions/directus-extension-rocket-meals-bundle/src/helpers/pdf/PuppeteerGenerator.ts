import {PdfGeneratorOptions} from "./PdfGeneratorHelper";
import puppeteer from 'puppeteer-core';

export async function generatePdfFromHtmlPuppeteer(html: string, options: PdfGeneratorOptions): Promise<Buffer> {
    let browser;
    try {
        browser = await puppeteer.launch({ channel: "chrome", headless: true });
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: "networkidle0" });

        // Merge provided options with defaults
        const pdfOptions = options

        const pdfUint8Array = await page.pdf(pdfOptions);
        let result = Buffer.from(pdfUint8Array); // ✅ Convert Uint8Array to Buffer
        return result
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw new Error("Failed to generate PDF");
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
