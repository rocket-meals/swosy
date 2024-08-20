// small jest test
import {describe, expect, it, jest} from '@jest/globals';
import {StudentenwerkOsnabrueckWashingmachineParser} from "../StudentenwerkOsnabrueckWashingmachineParser";
import axios from "axios";
import path from "path";
import fs from "fs";
import {DateHelper} from "../../../helpers/DateHelper";

const xml = fs.readFileSync(path.resolve(__dirname, './getAllTerminals.xml'), 'utf8');

describe("Osnabrueck Washer Test", () => {
    let osnabrueckWasherParser = new StudentenwerkOsnabrueckWashingmachineParser();

    it("Placeholder test", async () => {

        jest.spyOn(axios, 'get').mockImplementation((url) => {
            if (url === StudentenwerkOsnabrueckWashingmachineParser.getAllTerminalsUrl) {
                return Promise.resolve({ data: xml });
            }
            return Promise.reject(new Error('Unknown URL'));
        });

        let washers = await osnabrueckWasherParser.getWashingmachines();
        expect(washers.length).toBeGreaterThan(0);
        expect(washers.length).toBe(41);

        /**
         * <automatenNR>4</automatenNR>
         * <expectedFreeTime>153</expectedFreeTime>
         * <stateRunning>true</stateRunning>
         * <terminalN5>151</terminalN5>
         */
        const runningWasherExternalIdentifier = StudentenwerkOsnabrueckWashingmachineParser.getWasherExternalIdentifier(151, 4);
        const runningWasher = washers.find(w => w.basicData.external_identifier === runningWasherExternalIdentifier);
        expect(runningWasher).toBeDefined();
        expect(runningWasher?.basicData.date_finished).not.toBeNull();
        const dateFinished = new Date(runningWasher?.basicData.date_finished as string);
        // date_finished should be 153 minutes in the future or atleast in the future
        const nowWithoutTimezone = new Date(DateHelper.formatDateToIso8601WithoutTimezone(new Date()));
        expect(dateFinished.getTime()).toBeGreaterThan(nowWithoutTimezone.getTime());
    });
});