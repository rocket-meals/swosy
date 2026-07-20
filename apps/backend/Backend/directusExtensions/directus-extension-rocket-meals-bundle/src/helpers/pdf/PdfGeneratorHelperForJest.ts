import puppeteer from 'puppeteer';
import { PdfGeneratorHelper } from './PdfGeneratorHelper';
import { PuppeteerGenerator } from './PuppeteerGenerator';

export class PdfGeneratorForJest extends PdfGeneratorHelper {
  public static activateForJest() {
    PuppeteerGenerator.setPuppeteerForJest(puppeteer); // set puppeteer for jest tests
  }
}
