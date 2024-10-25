import React, {useEffect} from 'react';
import {useMyModalConfirmer} from "@/components/modal/MyModalConfirmer";
import {Text, View} from "@/components/Themed";
import {Canteens, PopupEvents} from "@/helper/database/databaseTypes/types";
import {useSynchedPopupEventsDict, useSynchedPopupEventsReadDict} from "@/states/SynchedPopupEvents";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
import {useProfileLanguageCode, useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {useIsDebug} from "@/states/Debug";
import DirectusImage from "@/components/project/DirectusImage";
import {RectangleWithLayoutCharactersWide} from '@/components/shapes/Rectangle';
import {useSearchParamKioskMode} from "@/helper/searchParams/SearchParams";

export type PopupEventsOverlayProps = {

}
export const PopupEventsOverlay = (props: PopupEventsOverlayProps) => {
	const popupEventsHidden = false;
	const [popupEventsDict, setPopupEventsDict, cacheHelperObjPopupEvents] = useSynchedPopupEventsDict()
	const [popupEventsReadDict, setPopupEventsReadDict] = useSynchedPopupEventsReadDict()
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const profileCanteenId = profileCanteen?.id
	const isDebug = useIsDebug()
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const kioskMode = useSearchParamKioskMode()

	let activePopupEvent: PopupEvents | undefined | null = getNextActivePopupEvent()

	const resource_translations = activePopupEvent?.translations as TranslationEntry[] || []
	const translated_title = getDirectusTranslation(languageCode, resource_translations, "title");
	const translated_content = getDirectusTranslation(languageCode, resource_translations, "content");

	if(kioskMode) {
		return null;
	}

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
			let canteens = popupEvent.canteens
			if(!canteens || canteens.length === 0) {
				popupEventsForCanteen.push(popupEvent)
			} else {
				let canteenRelationAsCanteens = canteens as Canteens[]
				for(let canteenRelation of canteenRelationAsCanteens) {
					if(!canteen_id || canteenRelation.id === canteen_id) {
						popupEventsForCanteen.push(popupEvent)
					}
				}
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
		//console.log("getNextActivePopupEvent")
		if(popupEventsDict && !popupEventsHidden) {
			//console.log("popupEventsDict", popupEventsDict)
			// okay check which popup events are not read yet and are not expired
			let unreadPopupEvents = getUnreadPopupEvents()
			//console.log("unreadPopupEvents", unreadPopupEvents)
			let popupEventsForCanteen = getPopupEventsForCanteen(profileCanteenId, unreadPopupEvents)
			//console.log("popupEventsForCanteen", popupEventsForCanteen)
			let activePopupEvents = getTimeRelevantPopupEvents(popupEventsForCanteen)
			//console.log("activePopupEvents", activePopupEvents)
			// sort activePopupEvents by date_start and get the latest start date
			activePopupEvents.sort((a, b) => {
				let date_start_a = a.date_start
				let date_start_b = b.date_start
				if(date_start_a && date_start_b) {
					return new Date(date_start_a).getTime() - new Date(date_start_b).getTime()
				} else if(date_start_a) {
					return -1
				} else if(date_start_b) {
					return 1
				} else {
					return 0
				}
			})

			// return the latest start date
			return activePopupEvents[activePopupEvents.length-1]
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
					let newValue = { ...currentValue };
					if (!newValue) {
						newValue = {};
					}
					newValue[activePopupEvent.id] = true;

					// Get the date of the active popup event (end date or start date)
					const activePopupEventDate = activePopupEvent.date_end
						? new Date(activePopupEvent.date_end)
						: new Date(activePopupEvent.date_start);

					// Mark all older popup events as read
					Object.keys(popupEventsDict).forEach((key) => {
						const popupEvent = popupEventsDict[key];
						if (popupEvent && popupEvent.id) {
							const popupEventDate = new Date(popupEvent.date_start);

							// Mark as read if the event is older than or equal to the active event
							if (popupEventDate <= activePopupEventDate) {
								newValue[popupEvent.id] = true;
							}
						}
					});

					console.log("newValue", newValue);
					return { ...newValue };
				});
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

	return null;


}