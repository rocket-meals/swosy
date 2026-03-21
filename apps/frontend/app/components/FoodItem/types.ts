import { SHEET_COMPONENTS } from '@/app/(app)/foodoffers';
import { DatabaseTypes } from 'repo-depkit-common';

export interface FoodItemSharedRenderProps {
	cardWidth?: number;
	language?: string;
	pirateLanguage?: boolean;
	funLanguageMode?: string | null;
	serverInfo?: any;
	appSettings?: any;
	primaryColor?: string;
	user?: any;
	isManagement?: boolean;
	profile?: any;
	markings?: any[];
	screenWidth?: number;
	theme?: any;
	amountColumnsForcard?: number;
}

export interface FoodItemProps extends FoodItemSharedRenderProps {
	item: DatabaseTypes.Foodoffers;
	canteen: DatabaseTypes.Canteens;
	// handleNavigation: (id: string, foodId: string) => void;
	handleMenuSheet: (sheet: keyof typeof SHEET_COMPONENTS) => void;
	handleImageSheet: (item: DatabaseTypes.Foods) => void;
	// setItemMarkings: React.Dispatch<React.SetStateAction<DatabaseTypes.FoodoffersMarkings[]>>;
	previousFeedback?: any;
}
