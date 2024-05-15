import {TL1Parser_GetRawReportInterface} from "./TL1Parser_GetRawReportInterface";
import path from "path";
import fs from "fs";

export class TL1Parser_RawReportFtpReader implements TL1Parser_GetRawReportInterface {
    private path_to_tl1_export: string;
    private encoding: string;

    constructor(path_to_tl1_export: string, encoding: string){
        this.path_to_tl1_export = path_to_tl1_export;
        this.encoding = encoding;
    }

    async getRawReport(): Promise<string | undefined> {
        console.log("TL1Parser: getRawReport");
        console.log("TL1Parser: path_to_tl1_export: "+this.path_to_tl1_export)
        if (this.path_to_tl1_export) {
            try{
                const absolutePath = path.resolve(this.path_to_tl1_export)
                console.log("TL1Parser: absolutePath: "+absolutePath)
                const options = {encoding: this.encoding};
                const content = fs.readFileSync(path.resolve(this.path_to_tl1_export), options);
                console.log("TL1 Report; length= "+content.length);
                const contentAsString = content.toString();
                return contentAsString;
            } catch (err: any){
                console.log("TL1 Report read error: ")
                console.log(err.toString())
            }
        }
        return undefined
    }
}
