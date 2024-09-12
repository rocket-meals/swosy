import {useSyncState} from '@/helper/syncState/SyncState';
import {PersistentStore} from '@/helper/syncState/PersistentStore';


export function useTermsAndPrivacyConsentAcceptedIsoDateString(): [string | null | undefined, (value: (((currentValue: string) => string) | string)) => void] {
	const [valueRaw, setValueRaw] = useSyncState<string, string>(PersistentStore.consentStatusTermsAndPrivacy)
	return [valueRaw, setValueRaw]
}

export function useTermsAndPrivacyConsentAcceptedDate(): [Date | null | undefined, (value: Date) => void] {
	const [valueRaw, setValueRaw] = useTermsAndPrivacyConsentAcceptedIsoDateString()
	const date = valueRaw ? new Date(valueRaw) : null
	const setDate = (value: Date) => setValueRaw(value.toISOString())
	return [date, setDate]
}