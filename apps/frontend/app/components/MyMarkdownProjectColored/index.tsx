import React from 'react';
import { CustomMarkdown, CustomMarkdownProps } from 'repo-depkit-common-ui';
import { useAppSelector } from '@/redux/hooks';

/**
 * CustomMarkdown pre-wired with the project's primary color from redux
 * (state.settings.primaryColor): link buttons and collapsible section
 * headers use the project color (with a matching contrast color) instead
 * of the shared theme's default yellow. An explicitly passed `accentColor`
 * (e.g. an area or wiki color) still wins over the project color.
 */
const MyMarkdownProjectColored: React.FC<CustomMarkdownProps> = ({ accentColor, ...props }) => {
	const primaryColor = useAppSelector((state) => state.settings.primaryColor);
	return <CustomMarkdown accentColor={accentColor || primaryColor} {...props} />;
};

export default MyMarkdownProjectColored;
