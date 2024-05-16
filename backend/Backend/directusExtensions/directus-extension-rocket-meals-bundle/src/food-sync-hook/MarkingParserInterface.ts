export interface MarkingParserInterface {

    createNeededData(): Promise<void>;

    getMarkingsJSONList(): Promise<any>;

}
