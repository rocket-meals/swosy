import {News} from "../databaseTypes/types";
import {TranslationsFromParsingType} from "../helpers/TranslationHelper";

type NewsTypeForParserOmmited = Omit<News, 'id' | 'user_created' | 'user_updated' | 'image' | "translations" |"status" | "external_identifier"> & {
    external_identifier: string
}
export type NewsTypeForParser = {
    basicNews: NewsTypeForParserOmmited,
    translations: TranslationsFromParsingType
}

export interface NewsParserInterface {

    getNewsItems(): Promise<NewsTypeForParser[]>;
}
