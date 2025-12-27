export interface CalendarSheetProps {
	closeSheet: () => void;
	onSelect?: (dateString: string) => void;
	selectedDateProp?: string;
	updateGlobal?: boolean;
	buttonColor?: string;
}

export type Direction = 'left' | 'right';
