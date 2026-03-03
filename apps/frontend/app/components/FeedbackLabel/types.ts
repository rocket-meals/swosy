import { DatabaseTypes } from 'repo-depkit-common';

export interface FeedbackLabelProps {
        label: Array<DatabaseTypes.FoodsFeedbacksLabelsTranslations>;
        imageUrl?: string | null | undefined;
        icon?: string;
        labelEntries: DatabaseTypes.FoodsFeedbacksLabelsEntries[];
        foodId: string;
        offerId?: string;
}
