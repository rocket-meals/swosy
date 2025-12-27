export interface CalendarSheetProps {
	closeSheet: () => void;
	onSelect?: (dateString: string) => void;
	selectedDateProp?: string;
	updateGlobal?: boolean;
}

export type Direction = 'left' | 'right';
