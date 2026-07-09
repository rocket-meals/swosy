import { ReactNode } from 'react';

export interface ScrollViewModalContentProps {
	title?: string;
	backgroundColor?: string;
	children?: ReactNode;
	// For FlatList mode
	useFlatList?: boolean;
	data?: any[];
	ListHeaderComponent?: ReactNode;
	ListFooterComponent?: ReactNode;
	// Optional additional props
	showsVerticalScrollIndicator?: boolean;
	keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
	disableHorizontalPadding?: boolean;
}
