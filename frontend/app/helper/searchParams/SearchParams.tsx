import {useGlobalSearchParams} from "expo-router";

export function useSearchParamKioskMode() {
    const params = useGlobalSearchParams<{ [SearchParams.KIOSK_MODE]?: string }>();
    let value = params[SearchParams.KIOSK_MODE];
    return value === 'true';
}

export enum SearchParams {
    KIOSK_MODE = 'kiosk_mode'
}