import {useGlobalSearchParams} from "expo-router";

export function useSearchParamKioskMode() {
    const params = useGlobalSearchParams<{ [SearchParams.KIOSK_MODE]?: string }>();
    let value = params[SearchParams.KIOSK_MODE];
    return value === 'true';
}

export enum SearchParams {
    KIOSK_MODE = 'kiosk_mode',
    LANGUAGE = 'language',
    CANTEENS_ID = 'canteens_id',
}

export function useSearchParamLanguage() {
    const params = useGlobalSearchParams<{ [SearchParams.LANGUAGE]?: string }>();
    return params[SearchParams.LANGUAGE];
}

export function useSearchParamSelectedCanteensId() {
    const params = useGlobalSearchParams<{ [SearchParams.CANTEENS_ID]?: string }>();
    return params[SearchParams.CANTEENS_ID];
}