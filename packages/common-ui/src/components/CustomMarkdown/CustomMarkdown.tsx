import { DimensionValue, Image, Linking, Text, View } from 'react-native';
import React, { useState } from 'react';
import { StringHelper } from 'repo-depkit-common';
import MarkdownCollapsibleSection from './MarkdownCollapsibleSection';
import MarkdownRedirectButton from './MarkdownRedirectButton';
import styles from './styles';
import { CustomMarkdownProps } from './types';
import { myContrastColor } from '../../helpers/ColorHelper';
import { useTheme } from '../../context/ThemeContext';
import { resolveLocationHref } from './MarkdownLinkHelper';

// Regex patterns for different content types. Every quantifier is bounded
// ({1,500} / {1,2000} / {0,5000}) so a pathological, non-matching input (e.g.
// a very long unterminated bracket) cannot force runtime proportional to an
// attacker-controlled input length (SonarCloud: super-linear regex backtracking).
export const CONTENT_PATTERNS = {
	email: /\[([^\]]{1,500})]\((mailto:[^)]{1,2000})\)/,
	location: /\[([^\]]{1,500})]\(((?:geo|maps):[^)]{1,2000})\)/i,
	link: /\[([^\]]{1,500})]\((https?:\/\/[^)]{1,2000})\)/,
	image: /!\[([^\]]*)]\(([^)]+)\)/,
	heading: /^#{1,3}\s{0,20}(.{0,5000})$/,
};

// Flush the buffered paragraph lines into the current stack frame's items.
// Returns the (always empty) replacement paragraph buffer.
const flushParagraph = (
	paragraph: Array<{ text: string; indent: number }>,
	targetItems: any[],
): Array<{ text: string; indent: number }> => {
	if (paragraph.length) {
		const minIndent = Math.min(...paragraph.map(item => item.indent));
		const textContent = paragraph.map(item => item.text).join('\n');
		targetItems.push({
			type: 'text',
			content: textContent,
			indent: Number.isFinite(minIndent) ? minIndent : 0,
		});
	}
	return [];
};

// Look ahead from fromIndex for the next non-empty line and report whether it is indented.
const computeStartCollapsed = (lines: string[], fromIndex: number): boolean => {
	for (let lookahead = fromIndex; lookahead < lines.length; lookahead += 1) {
		const lookLine = lines[lookahead];
		if (lookLine.trim() === '') {
			continue;
		}
		const lookNormalized = StringHelper.replaceAllLiteralWithOptions({ str: lookLine, find: '\t', replace: '    ' });
		const lookIndent = lookNormalized.match(/^\s*/)?.[0].length ?? 0;
		return lookIndent > 0;
	}
	return false;
};

// Apply a matched heading line to the section stack (push/pop levels, open collapsibles).
const applyHeadingToStack = (
	stack: Array<{ level: number; items: any[] }>,
	lines: string[],
	currentIndex: number,
	headingMatch: RegExpExecArray,
): void => {
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
		return;
	}

	while (stack.length > 1 && stack.at(-1)!.level >= level) {
		stack.pop();
	}

	const startCollapsed = computeStartCollapsed(lines, currentIndex + 1);

	const newSection = {
		type: 'collapsible',
		header: headerText,
		items: [],
		level,
		startCollapsed,
	};

	stack.at(-1)!.items.push(newSection);
	stack.push({ level, items: newSection.items });
};

// Try to match the line against the inline content patterns (image/email/location/link).
const matchInlineContentItem = (trimmedForMatch: string, indentLength: number): any => {
	const imageMatch = CONTENT_PATTERNS.image.exec(trimmedForMatch);
	if (imageMatch) {
		return {
			type: 'image',
			altText: imageMatch[1] || '',
			url: imageMatch[2] || '',
			indent: indentLength,
		};
	}

	const emailMatch = CONTENT_PATTERNS.email.exec(trimmedForMatch);
	if (emailMatch) {
		return {
			type: 'email',
			displayText: emailMatch[1],
			email: emailMatch[2],
			indent: indentLength,
		};
	}

	const locationMatch = CONTENT_PATTERNS.location.exec(trimmedForMatch);
	if (locationMatch) {
		return {
			type: 'location',
			displayText: locationMatch[1],
			url: locationMatch[2],
			indent: indentLength,
		};
	}

	const linkMatch = CONTENT_PATTERNS.link.exec(trimmedForMatch);
	if (linkMatch) {
		return {
			type: 'link',
			displayText: linkMatch[1],
			url: linkMatch[2],
			indent: indentLength,
		};
	}

	return null;
};

// Process markdown content into a structured format
const processMarkdownContent = (lines: string[]) => {
	const result: any[] = [];
	const stack: Array<{ level: number; items: any[] }> = [{ level: 0, items: result }];
	let currentParagraph: Array<{ text: string; indent: number }> = [];

	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const normalizedLine = StringHelper.replaceAllLiteralWithOptions({ str: line, find: '\t', replace: '    ' });
		const indentLength = normalizedLine.match(/^\s*/)?.[0].length ?? 0;
		const trimmedLine = line.trim();

		const headingMatch = CONTENT_PATTERNS.heading.exec(trimmedLine);
		if (headingMatch) {
			currentParagraph = flushParagraph(currentParagraph, stack.at(-1)!.items);
			applyHeadingToStack(stack, lines, i, headingMatch);
			continue;
		}

		if (trimmedLine === '') {
			currentParagraph = flushParagraph(currentParagraph, stack.at(-1)!.items);
			stack.at(-1)!.items.push({ type: 'emptyLine' });
			continue;
		}

		const trimmedForMatch = trimmedLine;

		const inlineItem = matchInlineContentItem(trimmedForMatch, indentLength);
		if (inlineItem) {
			currentParagraph = flushParagraph(currentParagraph, stack.at(-1)!.items);
			stack.at(-1)!.items.push(inlineItem);
			continue;
		}

		currentParagraph.push({
			text: trimmedLine,
			indent: indentLength,
		});
	}

	flushParagraph(currentParagraph, stack.at(-1)!.items);
	return result;
};

const calculateMarginLeft = (level: number, indent = 0) => level * 16 + indent * 4;

// **bold** and *italic* within paragraph text. Bold is tried first so
// "**x**" isn't consumed as "*" + "*x*" + "*".
const EMPHASIS_PATTERN = /\*\*(.{1,2000}?)\*\*|\*(.{1,2000}?)\*/g;

// Splits paragraph text into plain/bold/italic segments. Every other content
// type (headings, images, email/location/link buttons) is unaffected -
// emphasis markers only ever occur inside plain paragraph text.
const renderEmphasis = (text: string): React.ReactNode[] => {
	const nodes: React.ReactNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	let segmentIndex = 0;
	EMPHASIS_PATTERN.lastIndex = 0;

	while ((match = EMPHASIS_PATTERN.exec(text)) !== null) {
		if (match.index > lastIndex) {
			nodes.push(text.slice(lastIndex, match.index));
		}
		if (match[1] !== undefined) {
			nodes.push(<Text key={`b-${segmentIndex++}`} style={{ fontWeight: '700' }}>{match[1]}</Text>);
		} else {
			nodes.push(<Text key={`i-${segmentIndex++}`} style={{ fontStyle: 'italic' }}>{match[2]}</Text>);
		}
		lastIndex = EMPHASIS_PATTERN.lastIndex;
	}

	if (lastIndex < text.length) {
		nodes.push(text.slice(lastIndex));
	}

	return nodes;
};

// Component for rendering text with proper formatting
const TextContent = ({ text, level, indent, textColor }: { text: string; level: number; indent: number; textColor: string }) => (
	<Text
		style={{
			fontSize: 16,
			color: textColor,
			marginLeft: calculateMarginLeft(level, indent),
			lineHeight: 24,
		}}
	>
		{renderEmphasis(text)}
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

/**
 * Renders a constrained markdown dialect (headings, nested collapsible
 * sections, paragraphs, images, and email/location/link buttons) used for
 * wiki-style content across the apps: rocket-meals wikis, and the Score
 * Tracker / Geonexia privacy policy & imprint pages.
 */
const CustomMarkdown: React.FC<CustomMarkdownProps> = ({ content, backgroundColor, imageWidth, imageHeight }) => {
	const { theme, isDark } = useTheme();
	const accentColor = backgroundColor || theme.primary;

	const getContent = () => {
		if (content) {
			const rawText = content;
			const lines = rawText.split('\n');

			const contrastColor = myContrastColor(accentColor, theme, isDark);

			// Main renderer for content items
			const renderContentItem = (item: any, level: number, index: number) => {
				switch (item.type) {
					case 'heading':
						return (
							<Text
								key={`heading-${level}-${index}`}
								style={{
									fontSize: 24,
									fontWeight: '600',
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
								<MarkdownRedirectButton type="email" label={item.displayText} onClick={() => Linking.openURL(`mailto:${item.email}`)} backgroundColor={backgroundColor} color={contrastColor} />
							</View>
						);

					case 'link':
						return (
							<View key={`link-${level}-${index}`} style={{ marginLeft: calculateMarginLeft(level, item.indent || 0), marginBottom: 10 }}>
								<MarkdownRedirectButton type="link" label={item.displayText} onClick={() => Linking.openURL(item.url)} backgroundColor={backgroundColor} color={contrastColor} />
							</View>
						);

					case 'location': {
						const { resolvedHref } = resolveLocationHref(item.url);
						return (
							<View key={`location-${level}-${index}`} style={{ marginLeft: calculateMarginLeft(level, item.indent || 0), marginBottom: 10 }}>
								<MarkdownRedirectButton type="location" label={item.displayText} onClick={() => resolvedHref && Linking.openURL(resolvedHref)} backgroundColor={backgroundColor} color={contrastColor} />
							</View>
						);
					}

					case 'image':
						return <ImageContent key={`image-${level}-${index}`} url={item.url} altText={item.altText} level={level} indent={item.indent || 0} textColor={theme.screen.text} imageWidth={imageWidth} imageHeight={imageHeight} />;

					case 'collapsible':
						return (
							<View key={`collapsible-${level}-${index}`} style={{ marginTop: level > 0 ? 5 : 10 }}>
								<MarkdownCollapsibleSection headerText={item.header} customColor={backgroundColor} startCollapsed={item.startCollapsed}>
									{renderContent(item.items, level + 1)}
								</MarkdownCollapsibleSection>
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
