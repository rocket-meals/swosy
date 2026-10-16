export interface PopupEventSheetProps {
	closeSheet: () => void;
	eventData: any;
	/** The button "Schließen und nicht erneut anzeigen". Only for popups, a food offers card stays (default true). */
	showDismissButton?: boolean;
}
