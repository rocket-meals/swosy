export class CSVExportParser {

    static NEW_LINE_DELIMITER = "\n";
    static INLINE_DELIMITER_TAB = "\t";
    static INLINE_DELIMITER_SEMICOLON = ";";

    static getListOfLineObjects(text, newLineDelimiter, inlineDelimiter, removeTailoringQuotes=true){
        let lines = CSVExportParser.splitTextIntoLines(text, newLineDelimiter);
        return CSVExportParser.parseFileLinesToJSONList(lines, inlineDelimiter, removeTailoringQuotes)
    }

    static splitTextIntoLines(text, delimiter=CSVExportParser.NEW_LINE_DELIMITER){
        return text.split(delimiter);
    }

    static splitLineByDelimiter(line, delimiter = CSVExportParser.INLINE_DELIMITER_TAB, removeTailoringQuotes){
        let lineItemsList = line.split(delimiter);
        if(removeTailoringQuotes){
            for(let i=0; i<lineItemsList.length; i++){
                let item = lineItemsList[i];
                if(item.startsWith('"')){
                    item = item.substring(1);
                }
                if(item.endsWith('"')){
                    item = item.substring(0, item.length-1);
                }
            }
        }
        return lineItemsList;
    }

    static parseFileLinesToJSONList(lines, inlineDelimiter, removeTailoringQuotes){
        let identifierLineRaw = lines[0];
        let identifierLine = identifierLineRaw.trim();
        let identifierList = CSVExportParser.splitLineByDelimiter(identifierLine, inlineDelimiter, removeTailoringQuotes);
        let output = [];
        for(let i=1; i<lines.length; i++){
            let line = lines[i];
            if(!!line && line!==""){
                let lineItemList = CSVExportParser.splitLineByDelimiter(line, inlineDelimiter, removeTailoringQuotes);
                let lineObject = CSVExportParser.parseLineToJSON(lineItemList, identifierList);
                output.push(lineObject);
            }
        }
        return output;
    }

    static parseLineToJSON(lineItemList, identifierList){
        let output = {};
        for(let i=0; i<identifierList.length; i++){
            let identifier = identifierList[i];
            let value = lineItemList[i];
            output[identifier] = value;
        }
        return output;
    }
}
