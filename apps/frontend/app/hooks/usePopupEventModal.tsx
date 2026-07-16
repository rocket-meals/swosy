import React, { useCallback, useEffect, useRef, useState } from 'react';
import PopupEventSheet from '@/components/PopupEventSheet/PopupEventSheet';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useDispatch, shallowEqual } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { SET_POPUP_EVENTS } from '@/redux/Types/types';
import useKioskMode from '@/hooks/useKioskMode';

const usePopupEventModal = () => {
	const dispatch = useDispatch();
	const kioskMode = useKioskMode();
	const popupEvents = useAppSelector((state) => state.food.popupEvents, shallowEqual);
	const { showAndDiscardOthers: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const popupEventShownIdRef = useRef<string | null>(null);
	const [currentPopupEvent, setCurrentPopupEvent] = useState<any | null>(null);

	// Kept in sync with the redux value below, but also written to directly inside
	// markEventAsOpen so handleClosed can read the just-updated list synchronously,
	// without waiting for a redux round-trip and re-render.
	const popupEventsRef = useRef(popupEvents);
	useEffect(() => {
		popupEventsRef.current = popupEvents;
	}, [popupEvents]);

	const markEventAsOpen = useCallback(
		(event: any) => {
			if (!event) return;
			const updatedEvents = popupEventsRef.current.map((e: any) => (e.id === event.id ? { ...e, isOpen: true } : e));
			popupEventsRef.current = updatedEvents;
			dispatch({ type: SET_POPUP_EVENTS, payload: updatedEvents });
		},
		[dispatch]
	);

	// Always points at the latest showEvent so handleClosed can call it without a
	// circular useCallback dependency (handleClosed -> showEvent -> onClose -> handleClosed).
	const showEventRef = useRef<(event: any) => void>(() => {});

	// The single place that decides what happens once a popup event's sheet has *actually*
	// finished closing (native onClose fired after the real close animation - see
	// MyScrollViewModal's unmount-triggered onClose). Records the event as seen and, only
	// now that the sheet is confirmed empty, opens the next queued event if there is one.
	// Never opening the next event before this fires is what guarantees it can't be closed
	// again moments later by a close animation that was still in flight for the previous one.
	const handleClosed = useCallback(
		(event: any) => {
			if (event) markEventAsOpen(event);
			popupEventShownIdRef.current = null;
			setCurrentPopupEvent(null);

			if (kioskMode) return;
			const nextEvent = popupEventsRef.current?.find((e: any) => !e.isOpen);
			if (!nextEvent) return;
			showEventRef.current(nextEvent);
		},
		[kioskMode, markEventAsOpen]
	);

	const showEvent = useCallback(
		(event: any) => {
			popupEventShownIdRef.current = String(event.id ?? '');
			setCurrentPopupEvent(event);
			showScrollViewModal(
				{
					onClose: () => handleClosed(event),
					children: <PopupEventSheet closeSheet={closeScrollViewModal} eventData={event} />,
				},
				{}
			);
		},
		[closeScrollViewModal, handleClosed, showScrollViewModal]
	);
	showEventRef.current = showEvent;

	const openActiveModal = useCallback(() => {
		if (kioskMode) return;

		const nextEvent = popupEvents?.find((e: any) => !e.isOpen);
		if (!nextEvent) return;

		const eventId = String(nextEvent.id ?? '');
		if (popupEventShownIdRef.current === eventId) return;

		showEvent(nextEvent);
	}, [kioskMode, popupEvents, showEvent]);

	return { openActiveModal, activePopupEvent: currentPopupEvent, popupEvents };
};

export default usePopupEventModal;
