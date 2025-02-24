// import puppeteer from "puppeteer"; // Puppeteer does not work in directus, due to things like: WARN: __dirname is not defined in ES module scope
// import wkhtmltopdf from 'wkhtmltopdf'; // binaries needed or takes forever
// import html_to_pdf from 'html-pdf-node'; // WARN: __dirname is not defined in ES module scope
// import { chromium } from 'playwright'; // Requires chromium to be installed --> cannot be used therefore
// html2pdf.js only works in the browser

import { createRequire } from "module";
//const require = createRequire(import.meta.url);
//const { generatePdfFromHtmlPuppeteer } = require("./PuppeteerGenerator.cjs");

export type PdfGeneratorOptions = {
    format?: "A3" | "A4" | "A5" | "Legal" | "Letter" | "Tabloid";
    landscape?: boolean;
    printBackground?: boolean;
    margin?: {
        top?: string;
        bottom?: string;
        left?: string;
        right?: string;
    };
};

export class PdfGeneratorHelper {

    /** Returns the default PDF generation options */
    public static getDefaultPdfGeneratorOptions(): PdfGeneratorOptions {
        return {
            format: "A4",
            landscape: false,
            printBackground: true,
            margin: {
                top: "10mm",
                bottom: "10mm",
                left: "10mm",
                right: "10mm"
            }
        };
    }

    /** Generates a PDF from the provided HTML string */
    public static async generatePdfFromHtml(html: string, options?: PdfGeneratorOptions): Promise<Buffer> {
        //return generatePdfFromHtmlPuppeteer(html, options);
        return new Buffer("Not implemented");
    }


    /**
    private static async generatePdfWithPlaywright(html: string, options?: PdfGeneratorOptions): Promise<Buffer> {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.setContent(html);
        const pdf = await page.pdf({
            format: options?.format || 'A4',
            landscape: options?.landscape || false,
            printBackground: options?.printBackground || true,
            margin: options?.margin || {
                top: '10mm',
                bottom: '10mm',
                left: '10mm',
                right: '10mm'
            }
        });
        await browser.close();
        return pdf;
    }
        */

    /**
     * Binaries needed
     */
    /**
    private static async generatePdfFromHtmlWithWkhtmltopdf(html: string, options?: PdfGeneratorOptions): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            return new Promise((resolve, reject) => {
                const pdfStream = wkhtmltopdf(html, { pageSize: 'A4' });

                const chunks: Buffer[] = [];
                pdfStream.on('data', (chunk) => chunks.push(chunk));
                pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
                pdfStream.on('error', (err) => reject(err));
            });
        });
    }
        /**/

    /**
     * Uses pupeteer 10, so shows the problem WARN: __dirname is not defined in ES module scope
    private static async generatePdfFromHtmlWithHtmlPdfNode(html: string, options?: PdfGeneratorOptions): Promise<Buffer> {
        // Merge provided options with defaults
        const pdfOptions = { ...this.getDefaultPdfGeneratorOptions(), ...options };

        return new Promise((resolve, reject) => {
            html_to_pdf.generatePdf(
                { content: html },
                pdfOptions,
                (err, buffer) => {
                    if (err) {
                        reject(err); // Reject promise if an error occurs
                    } else {
                        resolve(buffer); // Resolve with the generated PDF buffer
                    }
                }
            );
        });
    }
        */

    /**
     * WARN: __dirname is not defined in ES module scope
     * Starting directus wont work
    private static async generatePdfFromHtmlWithPuppeteer10(html: string, options: PdfGeneratorOptions): Promise<Buffer> {
        // we are using headless mode
        let args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ];
        let browser;
        try {
            browser = await puppeteer.launch({ args: args });
            const page = await browser.newPage();

            await page.setContent(html, { waitUntil: "networkidle0" });

            // Merge provided options with defaults
            const pdfOptions = { ...this.getDefaultPdfGeneratorOptions(), ...options };

            const pdfUint8Array = await page.pdf(pdfOptions as puppeteer.PDFOptions);
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
        */


    /**
     * Generates a PDF from the provided HTML string using Puppeteer
     * @param html
     * @param options
     * @private
     *
     * Problems/Warnings in directus:
     * node_modules/yargs/build/lib/yargs-factory.js (7:38) The 'this' keyword is equivalent to 'undefined' at the top level of an ES module, and has been rewritten
     * WARN: Couldn't register bundle "directus-extension-rocket-meals-bundle"
     * WARN: __filename is not defined in ES module scope
     */
    /*
    private static async generatePdfFromHtmlWithPuppeteer24(html: string, options?: PdfGeneratorOptions): Promise<Buffer> {
        let browser;
        try {
            browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();

            await page.setContent(html, { waitUntil: "networkidle0" });

            // Merge provided options with defaults
            const pdfOptions = { ...this.getDefaultPdfGeneratorOptions(), ...options };

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
        /**/

}
