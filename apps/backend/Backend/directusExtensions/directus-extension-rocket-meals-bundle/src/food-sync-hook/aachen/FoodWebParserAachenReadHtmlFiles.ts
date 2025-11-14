import { CanteenNamesToHtmlFileDict } from './FoodAndMarkingWebParserAachen';

export interface FoodWebParserAachenReadHtmlFiles {
  getHtmlFilesForCanteens(): Promise<CanteenNamesToHtmlFileDict>;
}
