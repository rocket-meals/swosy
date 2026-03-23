type RawTextInput = string | Buffer | undefined;

export class CSVExportParser {
  static readonly NEW_LINE_DELIMITER = '\n';
  static readonly INLINE_DELIMITER_TAB = '\t';
  static readonly INLINE_DELIMITER_SEMICOLON = ';';

  static getListOfLineObjectsWithParams(text: RawTextInput, newLineDelimiter: string, inlineDelimiter: string, removeTailoringQuotes = true) {
    return CSVExportParser.getListOfLineObjects(text, {
      newLineDelimiter,
      inlineDelimiter,
      removeTailoringQuotes,
    });
  }

  static getListOfLineObjects(
    text: RawTextInput,
    options: {
      newLineDelimiter: string;
      inlineDelimiter: string;
      removeTailoringQuotes: boolean;
    }
  ) {
    let lines = CSVExportParser.splitTextIntoLines(text, options.newLineDelimiter);
    return CSVExportParser.parseFileLinesToJSONList(lines, options.inlineDelimiter, options.removeTailoringQuotes);
  }

  private static splitTextIntoLines(text: RawTextInput, delimiter = CSVExportParser.NEW_LINE_DELIMITER) {
    if (!text) {
      return [];
    }
    text = text.toString();
    return text.split(delimiter);
  }

  private static stripQuotesFromItem(item: string): string {
    let result = item;
    if (result.endsWith('\r')) {
      result = result.substring(0, result.length - 1);
    }
    if (result.startsWith('"')) {
      result = result.substring(1);
    }
    if (result.endsWith('"')) {
      result = result.substring(0, result.length - 1);
    }
    if (result.startsWith(String.raw`\"`)) {
      result = result.substring(2);
    }
    if (result.endsWith(String.raw`\"`)) {
      result = result.substring(0, result.length - 2);
    }
    return result;
  }

  private static splitLineByDelimiter(line: string, removeTailoringQuotes: boolean, delimiter = CSVExportParser.INLINE_DELIMITER_TAB) {
    // raw line: '" 040";"enthält Schalenfrüchte: Mandeln";"";"27J"'
    let lineItemsList = line.split(delimiter);
    if (removeTailoringQuotes) {
      for (let i = 0; i < lineItemsList.length; i++) {
        const item = lineItemsList[i];
        if (item) {
          lineItemsList[i] = CSVExportParser.stripQuotesFromItem(item);
        }
      }
    }
    return lineItemsList;
  }

  private static parseFileLinesToJSONList(lines: string[], inlineDelimiter: string, removeTailoringQuotes: boolean) {
    let output: { [p: string]: string }[] = [];
    let identifierLineRaw = lines[0];
    if (identifierLineRaw) {
      let identifierLine = identifierLineRaw.trim();
      let identifierList = CSVExportParser.splitLineByDelimiter(identifierLine, removeTailoringQuotes, inlineDelimiter);
      for (let i = 1; i < lines.length; i++) {
        let line = lines[i];
        if (line && line !== '') {
          let lineItemList = CSVExportParser.splitLineByDelimiter(line, removeTailoringQuotes, inlineDelimiter);
          let lineObject = CSVExportParser.parseLineToJSON(lineItemList, identifierList);
          output.push(lineObject);
        }
      }
    }
    return output;
  }

  private static parseLineToJSON(lineItemList: string[], identifierList: string[]) {
    let output: {
      [key: string]: string;
    } = {};
    for (let i = 0; i < identifierList.length; i++) {
      const identifier = identifierList[i];
      if (identifier) {
        const value = lineItemList[i];
        if (value !== undefined && value !== null) {
          // allow empty strings
          output[identifier] = value;
        }
      }
    }
    return output;
  }
}
