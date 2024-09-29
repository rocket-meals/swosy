import {Washingmachines} from "../databaseTypes/types";

export type WashingmachinesTypeForParserOmmited = Omit<Washingmachines, 'id' | 'user_created' | 'user_updated' |"status" | "date_stated" | "external_identifier"> & {
    external_identifier: string
}
export type WashingmachinesTypeForParser = {
    basicData: WashingmachinesTypeForParserOmmited,
}


export interface WashingmachineParserInterface{

    getWashingmachines(): Promise<WashingmachinesTypeForParser[]>;

}
