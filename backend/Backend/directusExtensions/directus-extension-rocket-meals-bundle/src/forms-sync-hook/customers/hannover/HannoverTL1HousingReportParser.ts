import {HannoverHousingFileReaderInterface} from "./HannoverTL1HousingFileReader";

export class HannoverTL1HousingReportParser {

    private reader: HannoverHousingFileReaderInterface

    constructor(reader: HannoverHousingFileReaderInterface) {
        this.reader = reader;
    }

    async parseReport() {
        return {};
    }

}