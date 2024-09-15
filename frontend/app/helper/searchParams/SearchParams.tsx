import {router, useGlobalSearchParams} from "expo-router";
import {DateHelper} from "@/helper/date/DateHelper";

export function useSearchParamKioskMode() {
    const params = useGlobalSearchParams<{ [SearchParams.KIOSK_MODE]?: string }>();
    let value = params[SearchParams.KIOSK_MODE];
    return value === 'true';
}

export enum SearchParams {
    KIOSK_MODE = 'kiosk_mode',
    LANGUAGE = 'language',
    CANTEENS_ID = 'canteens_id',
    FOODOFFERS_DATE = 'foodoffers_date',
}

export function useSearchParamLanguage() {
    const params = useGlobalSearchParams<{ [SearchParams.LANGUAGE]?: string }>();
    return params[SearchParams.LANGUAGE];
}

export function useSearchParamSelectedCanteensId() {
    const params = useGlobalSearchParams<{ [SearchParams.CANTEENS_ID]?: string }>();
    return params[SearchParams.CANTEENS_ID];
}

export function useSearchParamSelectedFoodoffersDate(): [string | undefined, (date: Date) => void] {
    const params = useGlobalSearchParams<{ [SearchParams.FOODOFFERS_DATE]?: string }>();
    let foodOfferDate: string | undefined = params[SearchParams.FOODOFFERS_DATE]
    foodOfferDate = foodOfferDate ? foodOfferDate : undefined;
    const setDate = (date: Date) => {
        router.setParams({
            [SearchParams.FOODOFFERS_DATE]: DateHelper.formatToOfferDate(date)
        });
    }
    return [foodOfferDate, setDate];
}