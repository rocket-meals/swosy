import { readFileSync } from 'fs';
import { join } from 'path';
import { FoodWebParserAachenReadHtmlFiles } from './FoodWebParserAachenReadHtmlFiles';
import { CanteenNamesToHtmlFileDict } from './FoodAndMarkingWebParserAachen';

export class FoodWebParser_RawReportTestReaderAachen implements FoodWebParserAachenReadHtmlFiles {
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
    return FoodWebParser_RawReportTestReaderAachen.getSavedWeeklyPlanFromFile();
  }

  public static getSavedWeeklyPlanFromFile(): CanteenNamesToHtmlFileDict {
    const canteensHtmlFilesMap: CanteenNamesToHtmlFileDict = {};
    const filePath = join(__dirname, 'speiseplaene', 'academica-w.html');
    let content = readFileSync(filePath, 'utf-8');
    canteensHtmlFilesMap['Mensa Academica'] = content;
    return canteensHtmlFilesMap;
  }
}
