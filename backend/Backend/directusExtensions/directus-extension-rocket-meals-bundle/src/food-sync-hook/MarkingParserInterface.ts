import {Markings} from "../databaseTypes/types";
import {TranslationsFromParsingType} from "../helpers/TranslationHelper";

type MarkingTypeOmitedFields = Omit<Markings, "id" | "user_created" | "user_updated" | "translations">;
export type MarkingsTypeForParser = MarkingTypeOmitedFields & {external_identifier: string, translations: TranslationsFromParsingType};

export interface MarkingParserInterface {

    createNeededData(): Promise<void>;

    getMarkingsJSONList(): Promise<MarkingsTypeForParser[]>;

}
