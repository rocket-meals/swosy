// import puppeteer from "puppeteer"; // Puppeteer does not work in directus, due to things like: WARN: __dirname is not defined in ES module scope
// import wkhtmltopdf from 'wkhtmltopdf'; // binaries needed or takes forever
// import html_to_pdf from 'html-pdf-node'; // WARN: __dirname is not defined in ES module scope
// import { chromium } from 'playwright'; // Requires chromium to be installed --> cannot be used therefore
// html2pdf.js only works in the browser

import { PuppeteerGenerator } from './PuppeteerGenerator';
import { HtmlPdfGeneratorInterface, PdfGeneratorOptions, RequestOptions } from './PdfGeneratorInterfaces';

export class PdfGeneratorHelper implements HtmlPdfGeneratorInterface {
  /** Returns the default PDF generation options */
  public static getDefaultPdfGeneratorOptions(): PdfGeneratorOptions {
    return {
      format: 'A4',
      landscape: false,
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm',
      },
    };
  }

  /** Generates a PDF from the provided HTML string */
  public static async generatePdfFromHtml(
    html: string,
    requestOptions: RequestOptions,
    options?: PdfGeneratorOptions
  ): Promise<Buffer> {
    options = { ...this.getDefaultPdfGeneratorOptions(), ...options };
    return await PuppeteerGenerator.generatePdfFromHtmlPuppeteer(html, requestOptions, options);
  }

  public async generatePdfFromHtml(
    html: string,
    requestOptions: RequestOptions,
    options?: PdfGeneratorOptions
  ): Promise<Buffer> {
    return await PdfGeneratorHelper.generatePdfFromHtml(html, requestOptions, options);
  }
}
