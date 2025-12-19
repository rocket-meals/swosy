import {DatabaseTypes} from 'repo-depkit-common';

export interface ForecastSheetProps {
        closeSheet: () => void;
        forDate: string;
        canteen: DatabaseTypes.Canteens | null;
}
