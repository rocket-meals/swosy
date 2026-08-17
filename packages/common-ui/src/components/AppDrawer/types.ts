import { ImageSourcePropType } from 'react-native';

export interface DrawerItemBaseFields {
	label: string;
	hasUnread?: boolean;
	activeColor?: string;
	nativeID?: string;
}

export interface DrawerItem extends DrawerItemBaseFields {
	key: string;
	renderIcon: (isActive: boolean, color: string) => React.ReactNode;
	onPress: () => void;
}

export interface AppDrawerProps {
	logoSource?: ImageSourcePropType;
	renderLogo?: () => React.ReactNode;
	title?: string;
	onLogoPress?: () => void;
	items: DrawerItem[];
	bottomItems?: DrawerItem[];
	activeKey?: string;
	primaryColor?: string;
	footerContent?: React.ReactNode;
	/**
	 * App version shown at the very bottom of the drawer, below the bottom items
	 * and the footer content. Pass the same value the settings screen shows
	 * (`getVersionInternalForAppsettingsScreen()`), so users can verify which OTA
	 * update they are running without opening the settings screen.
	 */
	version?: string;
}
