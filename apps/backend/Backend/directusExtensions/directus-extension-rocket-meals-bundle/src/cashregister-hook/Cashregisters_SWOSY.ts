import axios from 'axios';
import { CashregistersTransactionsForParser, CashregisterTransactionParserInterface } from './CashregisterTransactionParserInterface';

const BUCHUNGSNUMMER = 'BUCHUNGSNUMMER';
const Datum = 'Datum';
const Name = 'Name';
const Menge = 'Menge';
const Verbrauchergruppe_ID = 'Verbrauchergruppe_ID';
const Kasse_ID = 'Kasse_ID';

interface Transaction {
  [key: string]: any;
  BUCHUNGSNUMMER: string;
  Datum: string;
  Name?: string;
  Menge?: number;
  Verbrauchergruppe_ID?: string;
  Kasse_ID: string;
}

export class CashregistersSwosy implements CashregisterTransactionParserInterface {
  password: string = '';
  api_url: string = '';

  constructor(api_url: string, password: string) {
    this.api_url = api_url;
    this.password = password;
  }

  async getTransactionsList(): Promise<CashregistersTransactionsForParser[]> {
    const data = await this.getAsJSON(this.api_url, this.password);
    const transactions: CashregistersTransactionsForParser[] = [];
    if (data) {
      for (const transactionId of Object.keys(data)) {
        if (transactionId) {
          const transaction = data[transactionId];
          if (transaction) {
            transactions.push({
              baseData: {
                quantity: transaction.Menge,
                name: transaction.Name,
                id: transaction.BUCHUNGSNUMMER,
                date: transaction.Datum,
              },
              cashregister_external_idenfifier: transaction.Kasse_ID,
            });
          }
        }
      }
    }
    return transactions;
  }

  async loadFromRemote(url: string, password: string): Promise<string> {
    const encodedToken = Buffer.from(password).toString('base64');

    const resArBuffer = await axios.request({
      method: 'GET',
      url: url,
      headers: { Authorization: 'Basic ' + encodedToken },
      responseType: 'arraybuffer',
    });

    const response = resArBuffer.data.toString('latin1');
    const text = Buffer.from(response, 'utf-8').toString();
    return text;
  }

  private static parseFieldValue(value: string, bez: string, parsedPart: Partial<Transaction>): void {
    switch (bez) {
      case BUCHUNGSNUMMER:
        parsedPart.BUCHUNGSNUMMER = CashregistersSwosy.transformBuchungsnummer(value);
        break;
      case Datum: {
        const transformedDate = CashregistersSwosy.transformDate(value);
        if (transformedDate) {
          parsedPart.Datum = transformedDate;
        }
        break;
      }
      case Name:
        parsedPart.Name = value;
        break;
      case Menge:
        parsedPart.Menge = Number.parseFloat(value);
        break;
      case Verbrauchergruppe_ID:
        parsedPart.Verbrauchergruppe_ID = value;
        break;
      case Kasse_ID:
        parsedPart.Kasse_ID = value;
        break;
      default:
        break;
    }
  }

  private static parseDataLine(line: string, bezeichnungen: string[]): Partial<Transaction> {
    const parsedPart: Partial<Transaction> = {};
    const parsedParts = line.split('\t');
    for (let index = 0; index < bezeichnungen.length; index++) {
      const value = parsedParts[index] || '';
      const bez = bezeichnungen[index];
      if (bez) {
        CashregistersSwosy.parseFieldValue(value, bez, parsedPart);
      }
    }
    return parsedPart;
  }

  async getAsJSON(url: string, password: string): Promise<Record<string, Transaction>> {
    const text = await this.loadFromRemote(url, password);

    const lineSeparator = text.includes('\r') ? '\r' : '\n';
    const fileLines = text.split(lineSeparator);

    const bezeichnungen: string[] = [];
    const data: Record<string, Transaction> = {};

    for (let lineNumber = 0; lineNumber < fileLines.length; lineNumber++) {
      const rawLine = fileLines[lineNumber];
      if (rawLine === undefined) {
        continue;
      }

      const line = rawLine.trim();

      if (lineNumber === 0) {
        for (const item of line.split('\t')) {
          bezeichnungen.push(item);
        }
      } else if (line !== '') {
        const parsedPart = CashregistersSwosy.parseDataLine(line, bezeichnungen);

        // check if parsedPart has all required fields of Transaction
        if (parsedPart.Datum && parsedPart.Kasse_ID && parsedPart.Menge && parsedPart.Name && parsedPart.Verbrauchergruppe_ID && parsedPart.BUCHUNGSNUMMER) {
          data[parsedPart.BUCHUNGSNUMMER] = {
            BUCHUNGSNUMMER: parsedPart.BUCHUNGSNUMMER,
            Datum: parsedPart.Datum,
            Kasse_ID: parsedPart.Kasse_ID,
            Menge: parsedPart.Menge,
            Name: parsedPart.Name,
            Verbrauchergruppe_ID: parsedPart.Verbrauchergruppe_ID,
          };
        }
      }
    }

    return data;
  }

  static transformDate(dateWithTime: string): string | null {
    const [date, time] = dateWithTime.split(' ');

    if (date === undefined || time === undefined) {
      return null;
    }

    const [day, month, year] = date.split('.').map(num => Number.parseInt(num, 10));
    if (day === undefined || month === undefined || year === undefined) {
      return null;
    }

    const [hour, minute, seconds] = time.split(':').map(num => Number.parseInt(num, 10));
    if (hour === undefined || minute === undefined || seconds === undefined) {
      return null;
    }

    // expected: 2024-08-21T14:37:5
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  static transformBuchungsnummer(buchungsnummer: string): string | undefined {
    // buchungsnummer could be something like: "123456 789012       345678" -> "123456-789012-345678"
    if (buchungsnummer) {
      let id = '';
      let isFirstWhitespace = false;
      for (const c of buchungsnummer) {
        if (c !== ' ') {
          isFirstWhitespace = true;
          id += c;
        } else if (isFirstWhitespace) {
          isFirstWhitespace = false;
          id += '-';
        }
      }
      return id;
    }
    return undefined;
  }
}
