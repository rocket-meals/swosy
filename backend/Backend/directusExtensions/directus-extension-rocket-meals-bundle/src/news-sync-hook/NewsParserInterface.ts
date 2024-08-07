import {News} from "../databaseTypes/types";

type NewsTranslationType = {     [x: string]: {         title: string;         content: string;         be_source_for_translations: true;         let_be_translated: false;     }; }

type NewsTypeForParserOmmited = Omit<News, 'id' | 'user_created' | 'user_updated' | 'image' | "translations" |"status">
export type NewsTypeForParser = NewsTypeForParserOmmited & {translations: NewsTranslationType}

export interface NewsParserInterface {

    getNewsItems(): Promise<NewsTypeForParser[]>;
}
