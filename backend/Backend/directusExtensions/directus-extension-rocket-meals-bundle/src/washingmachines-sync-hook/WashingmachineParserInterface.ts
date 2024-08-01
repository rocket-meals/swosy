import {Washingmachines} from "../databaseTypes/types";

export interface WashingmachineParserInterface{

    getWashingmachines(): Promise<Partial<Washingmachines>[]>;

}
