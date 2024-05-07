import axios from "axios"

const BUCHUNGSNUMMER = "BUCHUNGSNUMMER";
const Datum = "Datum";
const Name = "Name";
const Menge = "Menge";
const Verbrauchergruppe_ID = "Verbrauchergruppe_ID";
const Kasse_ID = "Kasse_ID";

export class Cashregisters_SWOSY {

    password = "";
    api_url = "";
    data = null;

    constructor(api_url, password) {
        this.api_url = api_url;
        this.password = password;
        this.data = null;
    }

    async loadData(){
        this.data = null;
        let data = await this.getAsJSON(this.api_url, this.password)
        this.data = data;
    }

    async getTransactionsList(){
        let transactions = [];
        if(!!this.data){
            let transactionIds = Object.keys(this.data)
            for(let i=0; i<transactionIds.length; i++){
                let transactionId = transactionIds[i];
                let transaction = this.data?.[transactionId];
                if(transaction){
                    transactions.push(transaction);
                }
            }
        }
        return transactions;
    }

    getIdFromTransaction(transaction){
        return transaction?.[BUCHUNGSNUMMER]
    }

    getDateFromTransaction(transaction){
        return transaction?.[Datum]
    }

    getNameFromTransaction(transaction){
        return transaction?.[Name]
    }

    getQuantityFromTransaction(transaction){
        return transaction?.[Menge]
    }

    getCashregisterExternalIdentifierFromTransaction(transaction){
        return transaction?.[Kasse_ID]
    }

    async loadFromRemote(url, password){
        const encodedToken = Buffer.from(password).toString('base64');

        const resArBuffer = await axios.request({
            method: 'GET',
            url: url,
            headers: { 'Authorization': 'Basic '+ encodedToken },
            responseType: 'arraybuffer',
        });
        let response = resArBuffer.data.toString("latin1");
        let text = Buffer.from(response, 'utf-8').toString();
        return text;
    }

    async getAsJSON(url, password) {

        //reading the export data
        let text = await this.loadFromRemote(url, password);
        let fileLines = new String(text).split("\r");

        //initializing variables
        let bezeichnungen = [];
        let data = {};

        //reading data line by line
        for (let lineNumber = 0; lineNumber < fileLines.length; lineNumber++) {
            //removing unnecessary whitespaces
            let line = fileLines[lineNumber].trim();

            //on line 0 it will add the fields in which the data will be stored
            if (lineNumber === 0) {
                let bez = line.split("\t");
                for (let i = 0; i < bez.length; i++) {
                    bezeichnungen.push(bez[i]);
                }
            }
            //on all other lines the data will be pushed in to the lists
            else {
                if (line === '') {
                    continue;
                }
                // init variables
                let parsedPart = {};
                //splitting on tabs
                let parsedParts = line.split("\t");

                // fill data of every meal
                let identifier = undefined;
                for (let index = 0; index < bezeichnungen.length; index++) {
                    let content = parsedParts[index];
                    const bez = bezeichnungen[index];
                    if(bez === BUCHUNGSNUMMER){
                        content = this.transformBuchungsnummer(content);
                        identifier = content;
                    }
                    if(bez === Datum){
                        content = new Date(this.transformDate(content));
                    }
                    parsedPart[bez] = parsedParts.length > index ? content : "";
                }

                data[identifier] = parsedPart;
            }
        }

        return data;
    }

    transformDate(dateWithTime) {
        // Split date and time
        let [date, time] = dateWithTime.split(" ");

        // Split date into day, month, year
        let [day, month, year] = date.split(".").map(num => parseInt(num));

        // Split time into hour, minute, seconds
        let [hour, minute, seconds] = time.split(":").map(num => parseInt(num));

        // Function to get the last Sunday of a month
        function getLastSunday(year, month) {
            let lastDay = new Date(year, month + 1, 0); // Last day of the month
            let dayOfWeek = lastDay.getDay();
            return new Date(year, month, lastDay.getDate() - dayOfWeek);
        }

        // Calculate DST start and end dates for the year
        let dstStart = getLastSunday(year, 2); // March (month index 2)
        let dstEnd = getLastSunday(year, 9);   // October (month index 9)

        // Create a date object for the input date
        let inputDate = new Date(year, month - 1, day, hour, minute, seconds);

        // Check if the date falls in DST period
        let isSummerTime = inputDate >= dstStart && inputDate < dstEnd;

        // Adjust hour for DST
        if (isSummerTime) {
            hour -= 1;
        } else {
            hour -= 0;
        }

        // Format the date back into the desired format
        return `${("0" + month).slice(-2)}.${("0" + day).slice(-2)}.${year} ${("0" + hour).slice(-2)}:${("0" + minute).slice(-2)}:${("0" + seconds).slice(-2)}`;
    }


    transformBuchungsnummer(buchungsnummer) {
        // e. G. "      100     2090        1        1"
        if(!!buchungsnummer){
            let id = "";
            let isFirstWhitespace = false;
            for(let c of buchungsnummer){
                if(c!==" "){
                    isFirstWhitespace = true;
                    id+=c;
                } else if(isFirstWhitespace) {
                    isFirstWhitespace = false;
                    id+="-";
                }
            }
            return id;
        }
        return undefined;
    }

}
