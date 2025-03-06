import {HannoverTL1HousingFileReader} from "./HannoverTL1HousingFileReader";
import {resolve} from "path";

const csvPath = resolve(__dirname, 'exampleData/whv_auszuege.csv');
//const realCsvPath = resolve(__dirname, 'exampleData/WohnungsWechsel.csv');

export class HannoverTL1HousingTestFileReader extends HannoverTL1HousingFileReader {

    constructor() {
        super(csvPath);
    }

}