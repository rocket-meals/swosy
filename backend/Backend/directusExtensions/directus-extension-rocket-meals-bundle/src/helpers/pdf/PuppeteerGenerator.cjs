const puppeteer = require("puppeteer");

/**
 * Generates a PDF from an HTML string using Puppeteer.
 * @param {string} html The HTML content.
 * @param {object} options The PDF generation options.
 * @returns {Promise<Buffer>} The generated PDF buffer.
 */
async function generatePdfFromHtmlPuppeteer(html, options = {}) {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: options.format || "A4",
            landscape: options.landscape || false,
            printBackground: options.printBackground !== false, // Default to true
            margin: options.margin || { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
        });

        return pdfBuffer;
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw new Error("Failed to generate PDF");
    } finally {
        if (browser) await browser.close();
    }
}

// Export the function so it can be called from ESM
module.exports = { generatePdfFromHtml };
