import { FoodWebParserAachenReadHtmlFiles } from './FoodWebParserAachenReadHtmlFiles';
import { CanteenNamesToHtmlFileDict } from './FoodAndMarkingWebParserAachen';

export class FoodWebParser_RawReportWebReaderAachen implements FoodWebParserAachenReadHtmlFiles {
  private readonly reportToReturn: string | undefined;

  constructor(reportToReturn?: string | undefined) {}

  static CanteensToUrlsMap: { [canteenAlias: string]: string } = {
    'Mensa Academica': 'https://www.studierendenwerk-aachen.de/speiseplaene/academica-w.html',
    'Mensa Ahornstraße': 'https://www.studierendenwerk-aachen.de/speiseplaene/ahornstrasse-w.html',
    'Bistro Tempelgraben': 'https://www.studierendenwerk-aachen.de/speiseplaene/templergraben-w.html',
    'Mensa Bayernallee': 'https://www.studierendenwerk-aachen.de/speiseplaene/bayernallee-w.html',
    'Mensa Eupener Straße': 'https://www.studierendenwerk-aachen.de/speiseplaene/eupenerstrasse-w.html',
    'Mensa KMAC': 'https://www.studierendenwerk-aachen.de/speiseplaene/goethestrasse-w.html',
    'Mensa Südpark': 'https://www.studierendenwerk-aachen.de/speiseplaene/suedpark-w.html',
    'Mensa Vita': 'https://www.studierendenwerk-aachen.de/speiseplaene/vita-w.html',
    'Mensa Jülich': 'https://www.studierendenwerk-aachen.de/speiseplaene/juelich-w.html',
  };

  public async getHtmlFilesForCanteens(): Promise<CanteenNamesToHtmlFileDict> {
    const canteensHtmlFilesMap: CanteenNamesToHtmlFileDict = {};

    for (const canteenName of Object.keys(FoodWebParser_RawReportWebReaderAachen.CanteensToUrlsMap)) {
      const rawReport = await this.getWebRawReport(canteenName);
      if (rawReport) {
        canteensHtmlFilesMap[canteenName] = rawReport;
      }
    }

    return canteensHtmlFilesMap;
  }

  private async getWebRawReport(canteenName: string): Promise<string | undefined> {
    const url = FoodWebParser_RawReportWebReaderAachen.CanteensToUrlsMap[canteenName];
    if (!url) {
      console.log(`No URL found for canteen: ${canteenName}`);
      return undefined;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`Failed to fetch report from URL: ${url}, status: ${response.status}`);
        return undefined;
      }
      const html = await response.text();
      return html;
    } catch (error) {
      console.log(`Error fetching report from URL: ${url}, error: ${error}`);
      return undefined;
    }
  }
}
