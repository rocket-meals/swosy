import {MarkingParserInterface} from "./MarkingParserInterface";
import path from "path";
import fs from "fs";
import {CSVExportParser} from "./CSVExportParser";
import {TranslationHelper} from "../helpers/TranslationHelper";

const FIELD_MARKING_TRANSLATION_NAME = "name"

export class MarkingTL1Parser implements MarkingParserInterface {

    private path_to_tl1_export: string;
    private encoding: string;
    private parsedReport: any;

    constructor(path_to_tl1_marking_export: string, encoding: string) {
        this.path_to_tl1_export = path_to_tl1_marking_export;
        this.encoding = encoding;
    }

    async createNeededData(){
        let rawExport = await this.getRawReport();
        this.parsedReport = CSVExportParser.getListOfLineObjects(rawExport);
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

    async getMarkingsJSONList(){
        let markings = [];
        for (let i = 0; i < this.parsedReport.length; i++){
            let parsedLineObject = this.parsedReport[i];
            let marking = this.getMarkingJSONFromRawMarking(parsedLineObject);
            if(marking){
                markings.push(marking);
            }
        }
        return markings;
    }

    private static getMarkingJSONFromRawMarking(rawMarking: any){
        let id = rawMarking["ID"];
        let name = rawMarking["BESCHREIBUNG"];
        let hint = rawMarking["HINWEISE"];
        let short = rawMarking["KUERZEL"];

        let externalIdentifier = this.getMarkingExternalIdentifier(id, short);
        if (!externalIdentifier){
            console.log("MarkingTL1Parser: getMarkingJSONFromRawMarking: externalIdentifier is null. Skip this marking.")
            return null;
        }

        let translations = {};
        if (name){
            let nameDe = MarkingTL1Parser.getMarkingNameDe(name);
            if(nameDe){
                translations[TranslationHelper.LANGUAGE_CODE_DE] = {[FIELD_MARKING_TRANSLATION_NAME]: nameDe};
            }
            let nameEn = MarkingTL1Parser.getMarkingNameEn(name);
            if(nameEn){
                translations[TranslationHelper.LANGUAGE_CODE_EN] = {[FIELD_MARKING_TRANSLATION_NAME]: nameEn};
            }
        }

        let marking = {
            externalIdentifier: externalIdentifier,
            alias: name,
            translations: translations
        }

        return marking;

    }

    private static getMarkingNameDe(name: string | undefined): string | undefined{
        /**
         *          " 104";"Gesund&Munter";"";"m"
         *          " 100";"nachhaltige Fischerei / sustainable fishery";"";"f"
         */

        // check if name is empty string then return undefined
        if (!name || name.trim() === ""){
            return undefined;
        }

        // check if name has a slash then return the part before the slash without leading and trailing spaces
        let slashIndex = name.indexOf("/");
        if (slashIndex > -1){
            return name.substring(0, slashIndex).trim();
        } else {
            return name.trim();
        }
    }

    private static getMarkingNameEn(name: string | undefined): string | undefined{
        /**
         *          " 104";"Gesund&Munter";"";"m"
         *          " 100";"nachhaltige Fischerei / sustainable fishery";"";"f"
         */

        // check if name is empty string then return undefined
        if (!name || name.trim() === ""){
            return undefined;
        }

        // check if name has a slash then return the part after the slash without leading and trailing spaces
        let slashIndex = name.indexOf("/");
        if (slashIndex > -1){
            return name.substring(slashIndex+1).trim();
        } else {
            return undefined;
        }
    }

    private getMarkingExternalIdentifier(id: string | undefined, short: string | undefined): string | null{
        // Hannover Mail to Mister Wiebesiek 15.05.2024 um 03:51 Uhr. Confirm the following:
        // The external identifier is, the short or if the short is empty the id without leading spaces and leading zeros.
        // id e.g. " 103" -> "103" or " 098" -> "98"
        // short e.g. "kt" -> "kt"
        let externalIdentifier = null
        if (short){
            externalIdentifier = short;
        } else if (id){
            externalIdentifier = id.trim();
            // check for leading zeros
            externalIdentifier = externalIdentifier.replace(/^0+/, '');
        }
        return externalIdentifier;
    }

}
