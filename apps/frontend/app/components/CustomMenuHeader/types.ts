import type React from 'react';

export interface CustomMenuHeaderProps {
	label: string;
	/** Optional buttons on the opposite side of the drawer button (e.g. an options menu). */
	rightContent?: React.ReactNode;
}

export type DrawerParamList = {
	index: undefined;
	settings: undefined;
};
