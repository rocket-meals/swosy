export class CSVExportParser {

    static NEW_LINE_DELIMITER = "\n";
    static INLINE_DELIMITER = "\t";

    static getListOfLineObjects(text, newLineDelimiter, inlineDelimiter){
        let lines = CSVExportParser.splitTextIntoLines(text, newLineDelimiter);
        return CSVExportParser.parseFileLinesToJSONList(lines, inlineDelimiter);
    }

    static splitTextIntoLines(text, delimiter=CSVExportParser.NEW_LINE_DELIMITER){
        return text.split(delimiter);
    }

    static splitLineByDelimiter(line, delimiter = CSVExportParser.INLINE_DELIMITER){
        return line.split(delimiter);
    }

    static parseFileLinesToJSONList(lines, inlineDelimiter){
        let identifierLineRaw = lines[0];
        let identifierLine = identifierLineRaw.trim();
        let identifierList = CSVExportParser.splitLineByDelimiter(identifierLine, inlineDelimiter);
        let output = [];
        for(let i=1; i<lines.length; i++){
            let line = lines[i];
            if(!!line && line!==""){
                let lineItemList = CSVExportParser.splitLineByDelimiter(line, inlineDelimiter);
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
