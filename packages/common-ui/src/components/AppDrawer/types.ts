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
}
