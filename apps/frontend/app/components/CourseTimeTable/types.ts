export type FirstDayOfWeek = {
	id: string;
	name: string;
};

export interface TimeTableField {
	id: number;
	leftIcon: any;
	label: string;
	value: any;
	rightIcon: any;
	handleFunction: () => void;
}

export interface CourseBottomSheetProps {
	timeTableData: TimeTableField[];
	closeSheet: () => void;
	isUpdate: boolean;
	selectedEventId: string;
}

export interface CourseBottomSheetState {
	selectedFirstDay: string;
	selectedItem: TimeTableField | null;
	windowWidth: number;
	data: TimeTableField[];
	inputValue: string;
}

export type BaseCourseTimetableEvent = {
	id?: string;
	title?: string;
	location?: string;
	color?: string;
	start: string;
	end: string;
	weekday: string;
};

export type EventTypes = {
	id?: string;
	title?: string;
	location?: string;
	color?: string;
	startTime: string;
	endTime: string;
	day: string;
};

export interface CourseTimetableProps {
	events: EventTypes[];
	openSheet: () => void;
	setIsUpdate: React.Dispatch<React.SetStateAction<boolean>>;
	setTimeTableData: React.Dispatch<React.SetStateAction<TimeTableField[]>>;
	setSelectedEventId: React.Dispatch<React.SetStateAction<string>>;
}
