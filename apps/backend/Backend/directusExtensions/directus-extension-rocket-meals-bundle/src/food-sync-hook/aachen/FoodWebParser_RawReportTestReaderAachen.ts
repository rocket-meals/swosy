import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FoodWebParserAachenReadHtmlFiles } from './FoodWebParserAachenReadHtmlFiles';
import { CanteenNamesToHtmlFileDict } from './FoodAndMarkingWebParserAachen';

export class FoodWebParserRawReportTestReaderAachen implements FoodWebParserAachenReadHtmlFiles {
  private readonly canteensHtmlFilesMap: CanteenNamesToHtmlFileDict | undefined;

  constructor(canteensHtmlFilesMap?: CanteenNamesToHtmlFileDict) {
    if (canteensHtmlFilesMap) {
      this.canteensHtmlFilesMap = canteensHtmlFilesMap;
    }
  }

  async getHtmlFilesForCanteens(): Promise<CanteenNamesToHtmlFileDict> {
    if (this.canteensHtmlFilesMap) {
      return this.canteensHtmlFilesMap;
    }
    return FoodWebParserRawReportTestReaderAachen.getSavedWeeklyPlanFromFile();
  }

  public static getSavedWeeklyPlanFromFile(): CanteenNamesToHtmlFileDict {
    const canteensHtmlFilesMap: CanteenNamesToHtmlFileDict = {};
    const filePath = join(__dirname, 'speiseplaene', 'academica-w.html');
    let content = readFileSync(filePath, 'utf-8');
    canteensHtmlFilesMap['Mensa Academica'] = content;
    return canteensHtmlFilesMap;
  }
}
