import {readFileSync} from "fs";
import {CSVExportParser} from "../../../food-sync-hook/CSVExportParser";
import {HashHelper} from "../../../helpers/HashHelper";


export enum HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS {
    WOHNUNGSNUMMER = "WHNR", // Wohnungsnummer
    WOHNUNGSNAME = "WHNAME", // Wohnungsname
    MIETER_PERSONENNUMMER = "PERSONNR", // Mieter Personennummer
    MIETER_PERSON_NACHNAME = "NAME", // Mieter Nachname
    MIETER_PERSON_VORNAME = "VORNAME", // Mieter Vorname
    MIETER_MIETBEGINN = "MIETBEGINN", // Mieter Mietbeginn
    MIETER_MIETENDE = "MIETENDE", // Mieter Mietende
    MIETER_AUSZUGSDATUM = "AUSZUG", // Mieter Auszugsdatum
    MIETER_TELEFON_MOBILE = "TELEFONMOBIL", // Mieter Telefon Mobil
    MIETER_EMAIL = "EMAIL" // Mieter Email
}

export type Tl1ImportHousingContract = {
    [key in HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS]: string
};

export type Tl1ImportHousingContracts = Tl1ImportHousingContract[]

export interface HannoverHousingFileReaderInterface {
    readData(): Promise<Tl1ImportHousingContracts>
    getHousingContractExternalId(housingContract: Tl1ImportHousingContract): string
    getResultHash(TL1ImportHousingContracts: Tl1ImportHousingContracts): string
}

export class HannoverTL1HousingFileReader implements HannoverHousingFileReaderInterface {

    private path_to_file: string;

    constructor(path_to_file: string) {
        this.path_to_file = path_to_file;
    }

    async readData(): Promise<Tl1ImportHousingContracts> {
        const csvContent = readFileSync(this.path_to_file, "latin1");
        let rawReport = csvContent;
        let jsonListFromCsvString = CSVExportParser.getListOfLineObjects(rawReport, {
            newLineDelimiter: CSVExportParser.NEW_LINE_DELIMITER,
            inlineDelimiter: CSVExportParser.INLINE_DELIMITER_SEMICOLON,
            removeTailoringQuotes: true
        });
        let result: Tl1ImportHousingContracts = jsonListFromCsvString as Tl1ImportHousingContracts;
        return result;
    }

    getResultHash(TL1ImportHousingContracts: Tl1ImportHousingContracts): string {
        return HashHelper.hashFromObject(TL1ImportHousingContracts);
    }

    private getPartialExternalId(housingContract: Tl1ImportHousingContract, field: HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS): string {
        return `${field}_${housingContract[field]}`;
    }

    getHousingContractExternalId(housingContract: Tl1ImportHousingContract): string {
        // Wohnungsnummer + Mieter Personennummer + Mieter Mietbeginn sollten eindeutig sein
        // so kann ein Mieter mehrere Wohnungen haben, aber nicht zur gleichen Zeit
        // so kann eine Wohnung mehrere Mieter haben, zur gleichen Zeit
        let wohnungsNummerIdString = this.getPartialExternalId(housingContract, HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.WOHNUNGSNUMMER);
        let personenNummerIdString = this.getPartialExternalId(housingContract, HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.MIETER_PERSONENNUMMER);
        let mietBeginnIdString = this.getPartialExternalId(housingContract, HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.MIETER_MIETBEGINN);
        return `${wohnungsNummerIdString}-${personenNummerIdString}-${mietBeginnIdString}`;
    }

}