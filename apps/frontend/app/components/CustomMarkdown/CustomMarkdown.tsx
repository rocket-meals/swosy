import { DimensionValue, Image, Linking, Text, View } from 'react-native';
import React, { useState } from 'react';
import CustomCollapsible from '../CustomCollapsible/CustomCollapsible';
import RedirectButton from '../RedirectButton';
import styles from './styles';
import { CustomMarkdownProps } from './types';
import { myContrastColor } from '@/helper/ColorHelper';
import { useAppSelector } from '@/redux/hooks';
import { useTheme } from '@/hooks/useTheme';
import { StringHelper } from 'repo-depkit-common';
import { resolveLocationHref } from '@/helper/MarkdownLinkHelper';

// Regex patterns for different content types
const CONTENT_PATTERNS = {
	email: /\[([^\]]+)]\((mailto:[^)]+)\)/,
	location: /\[([^\]]+)]\(((?:geo|maps):[^)]+)\)/i,
	link: /\[([^\]]+)]\((https?:\/\/[^)]+)\)/,
	image: /!\[([^\]]*)]\(([^)]+)\)/,
	heading: /^#{1,3}\s*(.*)$/,
};

// Process markdown content into a structured format
const processMarkdownContent = (lines: string[]) => {
	const result: any[] = [];
	const stack: Array<{ level: number; items: any[] }> = [{ level: 0, items: result }];
	let currentParagraph: Array<{ text: string; indent: number }> = [];

	const flushTextContent = () => {
		if (currentParagraph.length) {
			const minIndent = Math.min(...currentParagraph.map(item => item.indent));
			const textContent = currentParagraph.map(item => item.text).join('\n');
			stack.at(-1)!.items.push({
				type: 'text',
				content: textContent,
				indent: Number.isFinite(minIndent) ? minIndent : 0,
			});
			currentParagraph = [];
		}
	};

	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const normalizedLine = StringHelper.replaceAllLiteralWithOptions({ str: line, find: '\t', replace: '    ' });
		const indentLength = normalizedLine.match(/^\s*/)?.[0].length ?? 0;
		const trimmedLine = line.trim();

		const headingMatch = CONTENT_PATTERNS.heading.exec(trimmedLine);
		if (headingMatch) {
			flushTextContent();

			const level = headingMatch[0].match(/#/g)?.length || 1;
			const headerText = headingMatch[1].trim();

			if (level === 1) {
				while (stack.length > 1) {
					stack.pop();
				}

				stack.at(-1)!.items.push({
					type: 'heading',
					content: headerText,
					level,
				});
				continue;
			}

			while (stack.length > 1 && stack.at(-1)!.level >= level) {
				stack.pop();
			}

			let startCollapsed = false;
			for (let lookahead = i + 1; lookahead < lines.length; lookahead += 1) {
				const lookLine = lines[lookahead];
				if (lookLine.trim() === '') {
					continue;
				}
				const lookNormalized = StringHelper.replaceAllLiteralWithOptions({ str: lookLine, find: '\t', replace: '    ' });
				const lookIndent = lookNormalized.match(/^\s*/)?.[0].length ?? 0;
				startCollapsed = lookIndent > 0;
				break;
			}

			const newSection = {
				type: 'collapsible',
				header: headerText,
				items: [],
				level,
				startCollapsed,
			};

			stack.at(-1)!.items.push(newSection);
			stack.push({ level, items: newSection.items });
			continue;
		}

		if (trimmedLine === '') {
			flushTextContent();
			stack.at(-1)!.items.push({ type: 'emptyLine' });
			continue;
		}

		const trimmedForMatch = trimmedLine;

		if (CONTENT_PATTERNS.image.test(trimmedForMatch)) {
			flushTextContent();
			const match = CONTENT_PATTERNS.image.exec(trimmedForMatch);
			stack.at(-1)!.items.push({
				type: 'image',
				altText: match?.[1] || '',
				url: match?.[2] || '',
				indent: indentLength,
			});
			continue;
		}

		if (CONTENT_PATTERNS.email.test(trimmedForMatch)) {
			flushTextContent();
			const match = CONTENT_PATTERNS.email.exec(trimmedForMatch);
			stack.at(-1)!.items.push({
				type: 'email',
				displayText: match?.[1],
				email: match?.[2],
				indent: indentLength,
			});
			continue;
		}

		if (CONTENT_PATTERNS.location.test(trimmedForMatch)) {
			flushTextContent();
			const match = CONTENT_PATTERNS.location.exec(trimmedForMatch);
			stack.at(-1)!.items.push({
				type: 'location',
				displayText: match?.[1],
				url: match?.[2],
				indent: indentLength,
			});
			continue;
		}

		if (CONTENT_PATTERNS.link.test(trimmedForMatch)) {
			flushTextContent();
			const match = CONTENT_PATTERNS.link.exec(trimmedForMatch);
			stack.at(-1)!.items.push({
				type: 'link',
				displayText: match?.[1],
				url: match?.[2],
				indent: indentLength,
			});
			continue;
		}

		currentParagraph.push({
			text: trimmedLine,
			indent: indentLength,
		});
	}

	flushTextContent();
	return result;
};

const calculateMarginLeft = (level: number, indent = 0) => level * 16 + indent * 4;

// Component for rendering text with proper formatting
const TextContent = ({ text, level, indent, textColor }: { text: string; level: number; indent: number; textColor: string }) => (
	<Text
		style={{
			fontSize: 16,
			fontFamily: 'Poppins_400Regular',
			color: textColor,
			marginLeft: calculateMarginLeft(level, indent),
			lineHeight: 24,
		}}
	>
		{text}
	</Text>
);

// Component for rendering images
const ImageContent = ({
	url,
	altText,
	level,
	indent,
	textColor,
	imageWidth,
	imageHeight,
}: {
	url: string;
	altText: string;
	level: number;
	indent: number;
	textColor: string;
	imageWidth?: string | number;
	imageHeight?: string | number;
}) => {
	const [error, setError] = useState(false);

	return (
		<View
			style={{
				width: '100%',
				alignItems: 'center',
				marginLeft: calculateMarginLeft(level, indent),
				marginVertical: 10,
				borderRadius: 8,
				overflow: 'hidden',
				marginTop: 20,
			}}
		>
			{error ? (
				<View
					style={{
						borderWidth: 1,
						borderColor: textColor,
						justifyContent: 'center',
						alignItems: 'center',
						padding: 10,
					}}
				>
					<Text
						style={{
							fontSize: 12,
							color: textColor,
							fontFamily: 'Poppins_400Regular',
							textAlign: 'center',
							fontStyle: 'italic',
						}}
					>
						{altText}
					</Text>
				</View>
			) : (
				<View
					style={{
						width: (imageWidth || '100%') as DimensionValue,
						height: (imageHeight || 400) as DimensionValue,
						justifyContent: 'center',
						alignItems: 'center',
						padding: 10,
					}}
				>
					<Image
						source={{ uri: url }}
						style={{
							width: (imageWidth || '100%') as DimensionValue,
							height: (imageHeight || 400) as DimensionValue,
							resizeMode: 'cover',
						}}
						onError={() => setError(true)}
					/>
				</View>
			)}
		</View>
	);
};

const CustomMarkdown: React.FC<CustomMarkdownProps> = ({ content, backgroundColor, imageWidth, imageHeight }) => {
	const { theme } = useTheme();
	const { primaryColor, selectedTheme: mode } = useAppSelector((state) => state.settings);

	const getContent = () => {
		if (content) {
			const rawText = content;
			const lines = rawText.split('\n');

			const contrastColor = myContrastColor(backgroundColor || primaryColor, theme, mode === 'dark');

			// Main renderer for content items
			const renderContentItem = (item: any, level: number, index: number) => {
				switch (item.type) {
					case 'heading':
						return (
							<Text
								key={`heading-${level}-${index}`}
								style={{
									fontSize: 24,
									fontFamily: 'Poppins_600SemiBold',
									color: theme.screen.text,
									marginTop: level === 0 ? 0 : 12,
									marginBottom: 12,
									marginLeft: calculateMarginLeft(level, 0),
								}}
							>
								{item.content}
							</Text>
						);

					case 'emptyLine':
						return <View key={`empty-${level}-${index}`} style={{ height: 16 }} />;

					case 'text':
						return <TextContent key={`text-${level}-${index}`} text={item.content} level={level} indent={item.indent || 0} textColor={theme.screen.text} />;

					case 'email':
						return (
							<View key={`email-${level}-${index}`} style={{ marginLeft: calculateMarginLeft(level, item.indent || 0), marginBottom: 10 }}>
								<RedirectButton type="email" label={item.displayText} onClick={() => Linking.openURL(`mailto:${item.email}`)} backgroundColor={backgroundColor || ''} color={contrastColor} />
							</View>
						);

					case 'link':
						return (
							<View key={`link-${level}-${index}`} style={{ marginLeft: calculateMarginLeft(level, item.indent || 0), marginBottom: 10 }}>
								<RedirectButton type="link" label={item.displayText} onClick={() => Linking.openURL(item.url)} backgroundColor={backgroundColor || ''} color={contrastColor} />
							</View>
						);

					case 'location': {
						const { resolvedHref } = resolveLocationHref(item.url);
						return (
							<View key={`location-${level}-${index}`} style={{ marginLeft: calculateMarginLeft(level, item.indent || 0), marginBottom: 10 }}>
								<RedirectButton type="location" label={item.displayText} onClick={() => resolvedHref && Linking.openURL(resolvedHref)} backgroundColor={backgroundColor || ''} color={contrastColor} />
							</View>
						);
					}

					case 'image':
						return <ImageContent key={`image-${level}-${index}`} url={item.url} altText={item.altText} level={level} indent={item.indent || 0} textColor={theme.screen.text} imageWidth={imageWidth} imageHeight={imageHeight} />;

					case 'collapsible':
						return (
							<View key={`collapsible-${level}-${index}`} style={{ marginTop: level > 0 ? 5 : 10 }}>
								<CustomCollapsible headerText={item.header} customColor={backgroundColor || ''} startCollapsed={item.startCollapsed}>
									{renderContent(item.items, level + 1)}
								</CustomCollapsible>
							</View>
						);

					default:
						return null;
				}
			};

			// Recursive content renderer
			const renderContent = (items: any[], level = 0) => {
				return items.map((item, index) => renderContentItem(item, level, index));
			};

			const hierarchicalContent = processMarkdownContent(lines);
			return <View style={{ paddingBottom: 20 }}>{renderContent(hierarchicalContent)}</View>;
		}

		return null;
	};
	return <View style={styles.container}>{getContent()}</View>;
};

export default CustomMarkdown;
