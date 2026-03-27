import { FoodTL1ParserGetRawReportInterface } from './FoodTL1Parser_GetRawReportInterface';
import { SystemFileHelper } from '../helpers/SystemFileHelper';

export class FoodTL1ParserRawReportFtpReader implements FoodTL1ParserGetRawReportInterface {
  private readonly path_to_tl1_export: string;
  private readonly encoding: BufferEncoding;

  constructor(path_to_tl1_export: string, encoding: BufferEncoding) {
    this.path_to_tl1_export = path_to_tl1_export;
    this.encoding = encoding;
  }

  async getRawReport(): Promise<string | undefined> {
    return await SystemFileHelper.readFileSync(this.path_to_tl1_export, this.encoding);
  }
}
