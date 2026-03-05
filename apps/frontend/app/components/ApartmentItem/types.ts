export interface BuildingItemProps {
	apartment: any;
	onEditImage?: (apartment: any) => void;
	openDistanceSheet: () => void;
	knownCardWidth?: number;
	housingAreaColor?: string;
	defaultImage?: string | null;
	theme: any;
	translate: (key: string) => string;
	isManagement: boolean;
	mode: 'light' | 'dark' | 'systematic';
}
