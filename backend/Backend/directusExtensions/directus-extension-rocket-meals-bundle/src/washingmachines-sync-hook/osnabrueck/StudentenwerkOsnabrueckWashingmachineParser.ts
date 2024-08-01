import axios from "axios";
import xml2js from "xml2js";

import {WashingmachineParserInterface} from "./../WashingmachineParserInterface";
import {Washingmachines} from "../../databaseTypes/types";
import {DateHelper} from "../../helpers/DateHelper";

const url = "http://131.173.252.37:8080/smartWASH-WebService/JaxWsWashService/";

type IntercardWasher = {
    terminalNr: number,
    automateNr: number,
    intercardStatus: "false" | "true",
    expectedFreeTimeInMinutes: number
}


export class StudentenwerkOsnabrueckWashingmachineParser implements WashingmachineParserInterface {

    constructor() {

    }

    async getWashingmachines(): Promise<Partial<Washingmachines>[]> {
        let answer: Partial<Washingmachines>[] = [];
        let intercardWashers = await StudentenwerkOsnabrueckWashingmachineParser.getAllTerminalFromIntercard();
        for (let i = 0; i < intercardWashers.length; i++) {
            let washer = intercardWashers[i];
            if(!!washer) {
                let external_identifier = "osnabrueck_" + washer.terminalNr + "_" + washer.automateNr;
                let date_finished: string | null = null
                if(washer.intercardStatus === "true") {
                    let date = new Date();
                    date.setMinutes(date.getMinutes() + washer.expectedFreeTimeInMinutes);
                    date_finished = DateHelper.formatDateToIso8601WithoutTimezone(date);
                } else {
                    date_finished = null
                }

                let washingmachine: Partial<Washingmachines> = {
                    external_identifier: external_identifier,
                    alias: "Washingmachine " + washer.terminalNr + " " + washer.automateNr,
                    date_updated: DateHelper.formatDateToIso8601WithoutTimezone(new Date()),
                    date_finished: date_finished
                };
                answer.push(washingmachine);
            }
        }
        return answer;
    }


    /**
     * Get All Terminal Informations as JSON
     * @returns {Promise<Array>}
     */
    static async getAllTerminalFromIntercard(): Promise<IntercardWasher[]> {
        let html = await StudentenwerkOsnabrueckWashingmachineParser.getAllTerminalsRawFromIntercard();
        console.log("HTML from Intercard");
        console.log(html);
        let washerJSON = await StudentenwerkOsnabrueckWashingmachineParser.parseTerminalsRawFromIntercardToJSON(html);
        console.log("JSON from Intercard");
        console.log(washerJSON);
        return washerJSON;
    }

    /**
     * Gets the RAW informations of the terminals which is html/xml
     * @returns {Promise<null|*>}
     */
    static async getAllTerminalsRawFromIntercard(): Promise<string | null> {
        let getAllTerminalsFunction = "getAllTerminals"; //the function to call
        let urlForRequest = url + getAllTerminalsFunction; //the full url
        try {
            let response = await axios.get(urlForRequest); //get the html
             //get the data
            console.log("Response from Intercard");
            console.log(response.data);
            let data = response.data;
            console.log("Data from Intercard");
            console.log(data);
            if(!!data && typeof data === "string") {
                return response.data;
            }
        } catch (e) {
        }
        return null;
    }

    /**
     * Parse the RAW informations into a nice JSON format
     * @param html the raw informations
     * @returns {Promise<Array>} the parsed JSON
     */
    static async parseTerminalsRawFromIntercardToJSON(html: string | null): Promise<IntercardWasher[]> {
        let answer: IntercardWasher[] = []; //prepare an empty answer we will fill
        try {
            let json = await xml2js.parseStringPromise(html); //parse the html into json with too much informations for us

            //now search inside this hughe json our desired information
            let envelope = json["soap:Envelope"];
            let body = envelope["soap:Body"];
            let result = body[0];
            let list = result["ns1:getAllTerminalsResponse"];
            let firstList = list[0];
            let returnObj = firstList["return"][0];
            let listOfWashers = returnObj["list"]; //here are our washers finally

            for (let i = 0; i < listOfWashers.length; i++) { //for all washers
                let washerRaw = listOfWashers[i]; //get the washer
                let terminalNr = parseInt(washerRaw.terminalN5[0]); //get the terminal number, which represents the building
                let automateNr = parseInt(washerRaw.automatenNR[0]); //get the automate nr which represents the machine in the building
                let status = washerRaw.stateRunning[0]; //get state of the machine
                let expectedFreeTime = parseInt(washerRaw.expectedFreeTime[0]); //get when the machine thinks it will finish
                let washer: IntercardWasher = { //make nice json
                    terminalNr: terminalNr,
                    automateNr: automateNr,
                    intercardStatus: status, // "false": it did stop, "true": it is running or started
                    expectedFreeTimeInMinutes: expectedFreeTime
                };
                answer.push(washer); //add to answer
            }
        } catch (e) {
        }
        return answer;

    }


}
