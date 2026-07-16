import React, { useCallback, useRef, useState } from 'react';
import PopupEventSheet from '@/components/PopupEventSheet/PopupEventSheet';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { PopupEventHelper } from '@/helper/PopupEventHelper';
import { useDispatch, shallowEqual } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { SET_POPUP_EVENTS } from '@/redux/Types/types';
import useKioskMode from '@/hooks/useKioskMode';

const usePopupEventModal = () => {
	const dispatch = useDispatch();
	const kioskMode = useKioskMode();
	const popupEvents = useAppSelector((state) => state.food.popupEvents, shallowEqual);
	const { showAndDiscardOthers: showScrollViewModalAndDiscardOthers, close: closeScrollViewModal } = useMyScrollViewModal();
	const popupEventShownIdRef = useRef<string | null>(null);
	const [currentPopupEvent, setCurrentPopupEvent] = useState<any | null>(null);

	const markEventAsOpen = useCallback(
		(event: any) => {
			if (!event) return;
			const updatedEvents = popupEvents.map((e: any) => (e.id === event.id ? { ...e, isOpen: true } : e));
			dispatch({ type: SET_POPUP_EVENTS, payload: updatedEvents });
		},
		[dispatch, popupEvents]
	);

	// These two only record that the event has been handled (redux + the in-memory
	// "permanently dismissed" set) - they deliberately never touch the native sheet
	// themselves. openActiveModal (re-run because popupEvents/currentPopupEvent changed)
	// is the only place that decides whether to instantly swap in the next queued event
	// or actually close the sheet. Closing the sheet here and letting the next event's
	// open race the still-running close animation used to make that next event's sheet
	// close itself moments after opening.
	const closeEventSheet = useCallback(
		(event?: any) => {
			const targetEvent = event || currentPopupEvent;
			if (targetEvent) {
				markEventAsOpen(targetEvent);
			}
		},
		[currentPopupEvent, markEventAsOpen]
	);

	const closeEventSheetForSession = useCallback(
		(event?: any) => {
			const targetEvent = event || currentPopupEvent;
			if (targetEvent?.id) {
				PopupEventHelper.dismiss(targetEvent.id);
			}
			if (targetEvent) {
				markEventAsOpen(targetEvent);
			}
		},
		[currentPopupEvent, markEventAsOpen]
	);

	const openActiveModal = useCallback(() => {
		if (kioskMode) return;

		const nextEvent = popupEvents?.find((e: any) => !e.isOpen && !PopupEventHelper.isDismissed(e.id));

		if (!nextEvent) {
			// Nothing left in the queue. Only actually close the sheet if something from
			// this queue is still tracked as shown - otherwise there's nothing to do.
			if (popupEventShownIdRef.current !== null) {
				popupEventShownIdRef.current = null;
				setCurrentPopupEvent(null);
				closeScrollViewModal();
			}
			return;
		}

		const eventId = String(nextEvent.id ?? '');
		if (popupEventShownIdRef.current === eventId) return;
		popupEventShownIdRef.current = eventId;

		setCurrentPopupEvent(nextEvent);

		// discardOthers instantly swaps the sheet's content instead of closing and
		// reopening it, so advancing the queue never races a close animation.
		showScrollViewModalAndDiscardOthers(
			{
				onClose: () => closeEventSheetForSession(nextEvent),
				children: (
					<PopupEventSheet
						closeSheet={() => closeEventSheet(nextEvent)}
						dismissSheet={() => closeEventSheetForSession(nextEvent)}
						eventData={nextEvent}
					/>
				),
			},
			{}
		);
	}, [closeEventSheet, closeEventSheetForSession, closeScrollViewModal, kioskMode, popupEvents, showScrollViewModalAndDiscardOthers]);

	return { openActiveModal, activePopupEvent: currentPopupEvent, popupEvents };
};

export default usePopupEventModal;
