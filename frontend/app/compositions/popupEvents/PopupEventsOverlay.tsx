import React, {useEffect} from 'react';
import {useMyModalConfirmer} from "@/components/modal/MyModalConfirmer";
import {Text, View} from "@/components/Themed";
import {PopupEvents} from "@/helper/database/databaseTypes/types";
import {
	usePopupEventsAreHidden,
	useSynchedPopupEventsDict,
	useSynchedPopupEventsReadDict
} from "@/states/SynchedPopupEvents";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
import {useProfileLanguageCode, useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {useIsDebug} from "@/states/Debug";
import DirectusImage from "@/components/project/DirectusImage";
import {RectangleWithLayoutCharactersWide} from '@/components/shapes/Rectangle';

export type PopupEventsOverlayProps = {

}
export const PopupEventsOverlay = (props: PopupEventsOverlayProps) => {
	const popupEventsHidden = usePopupEventsAreHidden()
	const [popupEventsDict, setPopupEventsDict, cacheHelperObjPopupEvents] = useSynchedPopupEventsDict()
	const [popupEventsReadDict, setPopupEventsReadDict] = useSynchedPopupEventsReadDict()
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const profileCanteenId = profileCanteen?.id
	const isDebug = useIsDebug()
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	let activePopupEvent: PopupEvents | undefined | null = getNextActivePopupEvent()

	const resource_translations = activePopupEvent?.translations as TranslationEntry[] || []
	const translated_title = getDirectusTranslation(languageCode, resource_translations, "title");
	const translated_content = getDirectusTranslation(languageCode, resource_translations, "content");

	function getUnreadPopupEvents() {
		let unreadPopupEvents: PopupEvents[] = []
		if(popupEventsDict) {
			// okay check which popup events are not read yet and are not expired
			let popupEventKeys = Object.keys(popupEventsDict)
			if(popupEventKeys.length > 0){
				for(let key of popupEventKeys) {
					let popupEvent = popupEventsDict[key]
					if(!!popupEvent){
						let popupEventId = popupEvent.id
						// check if the popup event is not read yet
						let isRead = popupEventsReadDict[popupEventId]
						if(!isRead) {
							unreadPopupEvents.push(popupEvent)
						}
					}
				}
			}
		}
		return unreadPopupEvents
	}

	// function which gives me only events where the canteen matches the profile canteen or is null
	function getPopupEventsForCanteen(canteen_id: string | undefined | null, popupEvents: PopupEvents[]) {
		let popupEventsForCanteen: PopupEvents[] = []
		for(let popupEvent of popupEvents) {
			if(!popupEvent.canteen) { // if the canteen is null in the popup event
				popupEventsForCanteen.push(popupEvent)
			} else if(!!canteen_id && popupEvent.canteen === canteen_id) { // or if the canteen matches the profile canteen when set
				popupEventsForCanteen.push(popupEvent)
			}
		}
		return popupEventsForCanteen
	}

	// function which filters the popup events for the active time
	function getTimeRelevantPopupEvents(popupEvents: PopupEvents[]) {
		let timeRelevantPopupEvents: PopupEvents[] = []
		let now = new Date()
		for(let popupEvent of popupEvents) {
			let date_start_string = popupEvent.date_start
			let date_end_string = popupEvent.date_end

			// if no start and end date is set, the event is active
			if(!date_start_string && !date_end_string) {
				timeRelevantPopupEvents.push(popupEvent)
			} else {
				// start or end date is set or both
				let isInRange = true;
				if(!!date_start_string) {
					let date_start = new Date(date_start_string)
					if(now < date_start) {
						isInRange = false
					}
				}
				if(!!date_end_string) {
					let date_end = new Date(date_end_string)
					if(now > date_end) {
						isInRange = false
					}
				}
				if(isInRange) {
					timeRelevantPopupEvents.push(popupEvent)
				}
			}
		}
		return timeRelevantPopupEvents
	}

	function getNextActivePopupEvent() {
		if(popupEventsDict && !popupEventsHidden) {
			// okay check which popup events are not read yet and are not expired
			let unreadPopupEvents = getUnreadPopupEvents()
			let popupEventsForCanteen = getPopupEventsForCanteen(profileCanteenId, unreadPopupEvents)
			let activePopupEvents = getTimeRelevantPopupEvents(popupEventsForCanteen)
			if(activePopupEvents.length > 0) {
				return activePopupEvents[0]
			}
		}
		return null
	}

	function renderPopupEvent(popupEvent: PopupEvents) {
		const debugContent = <>
			<Text>{"popupEventsHidden"}</Text>
			<Text>{JSON.stringify(popupEventsHidden, null, 2)}</Text>
			<Text>{"Popup Events Dict"}</Text>
			<Text>{JSON.stringify(popupEventsReadDict, null, 2)}</Text>
			<Text>{"Popup Event"}</Text>
			<Text>{JSON.stringify(popupEvent, null, 2)}</Text>
		</>

		let image = popupEvent.image
		let image_remote_url = popupEvent.image_remote_url;
		let image_thumb_hash = popupEvent.image_thumb_hash;

		let imageComponent: any = null;
		if(!!image || !!image_remote_url || !!image_thumb_hash){

			imageComponent =
				<View style={{
					width: "100%",
					alignItems: "center",
					justifyContent: "center",
				}}>
					<RectangleWithLayoutCharactersWide amountOfCharactersWide={20}>
						<DirectusImage image_url={image_remote_url} assetId={image} thumbHash={image_thumb_hash} style={{width: '100%', height: '100%'}}/>
					</RectangleWithLayoutCharactersWide>
				</View>
		}

		let showDebugContent = isDebug

		return (
			<View style={{width: "100%"}}>
				<View style={{
					width: "100%",
					paddingHorizontal: 20,
				}}>
					<View style={{
						width: "100%",
						paddingBottom: 20,
					}}>
					</View>
					{imageComponent}
					<ThemedMarkdown markdown={translated_content} />
					{showDebugContent && debugContent}
				</View>
			</View>
		)
	}

	function renderActivePopupEvent() {
		if(activePopupEvent) {
			return renderPopupEvent(activePopupEvent)
		}
		return null
	}


	const showPopup = useMyModalConfirmer({
		hideConfirmAndCancelOption: true,
		title: translated_title,
		onConfirm: async() => {
			return true;
		},
		onCancel: async() => {
			console.log("onCancel")
			console.log("activePopupEvent", activePopupEvent)
			if(activePopupEvent && activePopupEvent.id) {

				setPopupEventsReadDict((currentValue) => {
					console.log("setPopupEventsReadDict")
					let newValue = {...currentValue}
					if(!newValue) {
						newValue = {}
					}
					newValue[activePopupEvent?.id] = true
					console.log("newValue", newValue)
					return {...newValue}
				})
			}
			return;
		},
		renderAsContentPreItems: (key: string, hide: () => void) => {
			return renderActivePopupEvent()
		}
	})

	useEffect(() => {
		if(activePopupEvent) {
			showPopup()
		}
	}, [activePopupEvent?.id])

	return null


}