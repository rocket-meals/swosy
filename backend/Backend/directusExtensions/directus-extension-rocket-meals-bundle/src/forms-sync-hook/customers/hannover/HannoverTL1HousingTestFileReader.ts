import {HannoverTL1HousingFileReader} from "./HannoverTL1HousingFileReader";
import {resolve} from "path";

const csvPath = resolve(__dirname, 'exampleData/whv_auszuege.csv');

export class HannoverTL1HousingTestFileReader extends HannoverTL1HousingFileReader {

    constructor() {
        super(csvPath);
    }

}