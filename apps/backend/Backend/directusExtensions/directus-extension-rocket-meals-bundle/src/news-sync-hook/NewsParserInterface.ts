import { DatabaseTypes } from 'repo-depkit-common';
import { TranslationsFromParsingType } from '../helpers/ContentTranslationHelper';
import { WorkflowRunLogger } from '../workflows-runs-hook/WorkflowRunJobInterface';

// The canteens are set by hand (where the news is shown in the app), a parser never touches them.
type NewsTypeForParserOmmited = Omit<DatabaseTypes.News, 'id' | 'user_created' | 'user_updated' | 'image' | 'translations' | 'status' | 'external_identifier' | 'canteens'> & {
  external_identifier: string;
};
export type NewsTypeForParser = {
  basicNews: NewsTypeForParserOmmited;
  translations: TranslationsFromParsingType;
};

export interface NewsParserInterface {
  getNewsItems(workflowRun?: DatabaseTypes.WorkflowsRuns, logger?: WorkflowRunLogger): Promise<NewsTypeForParser[]>;
}
