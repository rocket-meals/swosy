import React, { useCallback, useRef, useState } from 'react';
import PopupEventSheet from '@/components/PopupEventSheet/PopupEventSheet';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useTheme } from '@/hooks/useTheme';
import { PopupEventHelper } from '@/helper/PopupEventHelper';
import { useDispatch } from 'react-redux';
import { SET_POPUP_EVENTS } from '@/redux/Types/types';

type UsePopupEventModalProps = {
	popupEvents?: any[];
	kioskMode?: boolean;
};

const usePopupEventModal = ({ popupEvents = [], kioskMode = false }: UsePopupEventModalProps) => {
	const dispatch = useDispatch();
	const { theme } = useTheme();
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const popupEventShownIdRef = useRef<string | null>(null);
	const [currentPopupEvent, setCurrentPopupEvent] = useState<any | null>(null);
	const [sessionDismissed, setSessionDismissed] = useState<Set<string>>(PopupEventHelper.getAll());

	const markEventAsOpen = useCallback(
		(event: any) => {
			if (!event) return;
			const updatedEvents = popupEvents.map((e: any) => (e.id === event.id ? { ...e, isOpen: true } : e));
			dispatch({ type: SET_POPUP_EVENTS, payload: updatedEvents });
		},
		[dispatch, popupEvents]
	);

	const closeEventSheet = useCallback(
		(event?: any) => {
			const targetEvent = event || currentPopupEvent;
			closeScrollViewModal();
			if (targetEvent) {
				markEventAsOpen(targetEvent);
			}
			popupEventShownIdRef.current = null;
			setCurrentPopupEvent(null);
		},
		[closeScrollViewModal, currentPopupEvent, markEventAsOpen]
	);

	const closeEventSheetForSession = useCallback(
		(event?: any) => {
			const targetEvent = event || currentPopupEvent;
			closeScrollViewModal();
			if (targetEvent?.id) {
				PopupEventHelper.dismiss(targetEvent.id);
				setSessionDismissed(PopupEventHelper.getAll());
			}
			popupEventShownIdRef.current = null;
			setCurrentPopupEvent(null);
		},
		[closeScrollViewModal, currentPopupEvent]
	);

	const openActiveModal = useCallback(() => {
		if (kioskMode) return;

		const nextEvent = popupEvents?.find((e: any) => !e.isOpen && !PopupEventHelper.isDismissed(e.id));
		if (!nextEvent) return;

		const eventId = String(nextEvent.id ?? '');
		if (popupEventShownIdRef.current === eventId) return;
		popupEventShownIdRef.current = eventId;

		setCurrentPopupEvent(nextEvent);

		showScrollViewModal(
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
			{ backgroundStyle: { backgroundColor: theme.sheet.sheetBg }, headerBackgroundColor: theme.sheet.sheetBg }
		);
	}, [closeEventSheet, closeEventSheetForSession, kioskMode, popupEvents, sessionDismissed, showScrollViewModal, theme.sheet.sheetBg]);

	return { openActiveModal };
};

export default usePopupEventModal;
