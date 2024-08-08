import axios from "axios";
import { CashregistersTransactionsForParser, ParseScheduleInterface } from "./ParseScheduleInterface";

const BUCHUNGSNUMMER = "BUCHUNGSNUMMER";
const Datum = "Datum";
const Name = "Name";
const Menge = "Menge";
const Verbrauchergruppe_ID = "Verbrauchergruppe_ID";
const Kasse_ID = "Kasse_ID";

interface Transaction {
    [key: string]: any;
    BUCHUNGSNUMMER?: string;
    Datum?: Date;
    Name?: string;
    Menge?: string;
    Verbrauchergruppe_ID?: string;
    Kasse_ID?: string;
}

export class Cashregisters_SWOSY implements ParseScheduleInterface {
    password: string = "";
    api_url: string = "";

    constructor(api_url: string, password: string) {
        this.api_url = api_url;
        this.password = password;
    }

    async getTransactionsList(): Promise<CashregistersTransactionsForParser[]> {
        const data = await this.getAsJSON(this.api_url, this.password);
        const transactions: CashregistersTransactionsForParser[] = [];
        if (data) {
            const transactionIds = Object.keys(data);
            for (let i = 0; i < transactionIds.length; i++) {
                const transactionId = transactionIds[i];
                const transaction = data[transactionId];
                if (transaction) {
                    transactions.push(transaction);
                }
            }
        }
        return transactions;
    }

    getIdFromTransaction(transaction: Transaction): string | undefined {
        return transaction[BUCHUNGSNUMMER];
    }

    getDateFromTransaction(transaction: Transaction): Date | undefined {
        return transaction[Datum];
    }

    getNameFromTransaction(transaction: Transaction): string | undefined {
        return transaction[Name];
    }

    getQuantityFromTransaction(transaction: Transaction): string | undefined {
        return transaction[Menge];
    }

    getCashregisterExternalIdentifierFromTransaction(transaction: Transaction): string | undefined {
        return transaction[Kasse_ID];
    }

    async loadFromRemote(url: string, password: string): Promise<string> {
        const encodedToken = Buffer.from(password).toString("base64");

        const resArBuffer = await axios.request({
            method: "GET",
            url: url,
            headers: { Authorization: "Basic " + encodedToken },
            responseType: "arraybuffer",
        });
        const response = resArBuffer.data.toString("latin1");
        const text = Buffer.from(response, "utf-8").toString();
        return text;
    }

    async getAsJSON(url: string, password: string): Promise<Record<string, Transaction>> {
        const text = await this.loadFromRemote(url, password);
        const fileLines = text.split("\r");

        const bezeichnungen: string[] = [];
        const data: Record<string, Transaction> = {};

        for (let lineNumber = 0; lineNumber < fileLines.length; lineNumber++) {
            const line = fileLines[lineNumber].trim();

            if (lineNumber === 0) {
                const bez = line.split("\t");
                for (const item of bez) {
                    bezeichnungen.push(item);
                }
            } else {
                if (line === '') {
                    continue;
                }

                const parsedPart: Transaction = {};
                const parsedParts = line.split("\t");

                let identifier: string | undefined = undefined;
                for (let index = 0; index < bezeichnungen.length; index++) {
                    let content = parsedParts[index];
                    const bez = bezeichnungen[index];
                    if (bez === BUCHUNGSNUMMER) {
                        content = this.transformBuchungsnummer(content);
                        identifier = content;
                    }
                    if (bez === Datum) {
                        content = new Date(this.transformDate(content));
                    }
                    parsedPart[bez] = parsedParts.length > index ? content : "";
                }

                if (identifier) {
                    data[identifier] = parsedPart;
                }
            }
        }

        return data;
    }

    transformDate(dateWithTime: string): string {
        const [date, time] = dateWithTime.split(" ");

        const [day, month, year] = date.split(".").map(num => parseInt(num));
        const [hour, minute, seconds] = time.split(":").map(num => parseInt(num));

        function getLastSunday(year: number, month: number): Date {
            const lastDay = new Date(year, month + 1, 0);
            const dayOfWeek = lastDay.getDay();
            return new Date(year, month, lastDay.getDate() - dayOfWeek);
        }

        const dstStart = getLastSunday(year, 2);
        const dstEnd = getLastSunday(year, 9);

        const inputDate = new Date(year, month - 1, day, hour, minute, seconds);
        const isSummerTime = inputDate >= dstStart && inputDate < dstEnd;

        const adjustedHour = isSummerTime ? hour - 1 : hour;

        return `${("0" + month).slice(-2)}.${("0" + day).slice(-2)}.${year} ${("0" + adjustedHour).slice(-2)}:${("0" + minute).slice(-2)}:${("0" + seconds).slice(-2)}`;
    }

    transformBuchungsnummer(buchungsnummer: string): string | undefined {
        if (buchungsnummer) {
            let id = "";
            let isFirstWhitespace = false;
            for (const c of buchungsnummer) {
                if (c !== " ") {
                    isFirstWhitespace = true;
                    id += c;
                } else if (isFirstWhitespace) {
                    isFirstWhitespace = false;
                    id += "-";
                }
            }
            return id;
        }
        return undefined;
    }
}
