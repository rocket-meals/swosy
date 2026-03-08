import { DatabaseTypes } from 'repo-depkit-common';
import { SettingsListProps } from '@/components/SettingsList/types';

export interface FeedbackLabelProps {
        label: Array<DatabaseTypes.FoodsFeedbacksLabelsTranslations>;
        imageUrl?: string | null | undefined;
        icon?: string;
        labelEntries: DatabaseTypes.FoodsFeedbacksLabelsEntries[];
        foodId: string;
        offerId?: string;
        groupPosition?: SettingsListProps['groupPosition'];
        isAccountRequired?: boolean;
}
