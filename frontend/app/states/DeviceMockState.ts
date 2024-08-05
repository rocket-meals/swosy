import {useGlobalSearchParams} from "expo-router";

export type DeviceMockType = undefined | 'none' | 'iphone' | 'android'

export function useDeviceMockTypeState(): DeviceMockType {
	const globalSearchParams = useGlobalSearchParams()
	const valueRaw = globalSearchParams?.deviceMock
	if (valueRaw === undefined) {
		return undefined
	}
	// check is valueRaw is a string or an array
	if (typeof valueRaw === 'string') {
		if (valueRaw === 'none' || valueRaw === 'iphone' || valueRaw === 'android') {
			return valueRaw
		}
	}
	// if it is an array, return undefined
	return undefined
}