import { SHEET_COMPONENTS } from '@/app/(app)/foodoffers';
import { DatabaseTypes } from 'repo-depkit-common';
import { CardLayoutProps } from '@/components/shared/cardLayoutProps';

export interface FoodItemSharedRenderProps extends CardLayoutProps {
	cardWidth?: number;
	language?: string;
	pirateLanguage?: boolean;
	funLanguageMode?: string | null;
	serverInfo?: any;
	appSettings?: any;
	user?: any;
	profile?: any;
	markings?: any[];
	theme?: any;
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
