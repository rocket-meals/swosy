import { ReactNode } from 'react';

export interface ScreenHeaderProps {
	/** The header title text */
	label: string;
	/** Left-side element, e.g. a back or menu button */
	leftElement?: ReactNode;
	/** Right-side element, e.g. action buttons */
	rightElement?: ReactNode;
	/** Header height in pixels (default: 60) */
	height?: number;
}
