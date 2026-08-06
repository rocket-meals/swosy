import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export type SimpleMarkdownProps = {
	content: string;
	/** Color used for links and headings. Defaults to the theme's primary color. */
	accentColor?: string;
};

// Bold is tried before italic so "**x**" isn't consumed as "*" + "*x*" + "*".
const INLINE_PATTERN = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)]\(([^)]+)\)/g;

/**
 * Splits a single line of text into styled inline segments: **bold**,
 * *italic* and [label](url) links. Everything else is rendered as plain text.
 */
function renderInline(line: string, keyPrefix: string, textColor: string, linkColor: string): React.ReactNode[] {
	const nodes: React.ReactNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	let segmentIndex = 0;
	INLINE_PATTERN.lastIndex = 0;

	while ((match = INLINE_PATTERN.exec(line)) !== null) {
		if (match.index > lastIndex) {
			nodes.push(
				<Text key={`${keyPrefix}-text-${segmentIndex++}`} style={{ color: textColor }}>
					{line.slice(lastIndex, match.index)}
				</Text>,
			);
		}

		if (match[1] !== undefined) {
			nodes.push(
				<Text key={`${keyPrefix}-bold-${segmentIndex++}`} style={[styles.bold, { color: textColor }]}>
					{match[1]}
				</Text>,
			);
		} else if (match[2] !== undefined) {
			nodes.push(
				<Text key={`${keyPrefix}-italic-${segmentIndex++}`} style={[styles.italic, { color: textColor }]}>
					{match[2]}
				</Text>,
			);
		} else {
			const label = match[3];
			const url = match[4];
			nodes.push(
				<Text
					key={`${keyPrefix}-link-${segmentIndex++}`}
					style={[styles.link, { color: linkColor }]}
					onPress={() => Linking.openURL(url).catch(() => {})}
				>
					{label}
				</Text>,
			);
		}

		lastIndex = INLINE_PATTERN.lastIndex;
	}

	if (lastIndex < line.length) {
		nodes.push(
			<Text key={`${keyPrefix}-text-${segmentIndex++}`} style={{ color: textColor }}>
				{line.slice(lastIndex)}
			</Text>,
		);
	}

	return nodes;
}

/**
 * Minimal markdown renderer covering the subset used by the in-app legal
 * pages (privacy policy, imprint): headings (#/##/###), paragraphs, bold
 * text, links, list items and horizontal rules. Not a general-purpose
 * markdown engine - keep the source content within this subset.
 */
const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content, accentColor }) => {
	const { theme } = useTheme();
	const linkColor = accentColor ?? theme.primary;
	const lines = content.split('\n');

	const blocks: React.ReactNode[] = [];
	let paragraphLines: string[] = [];

	const flushParagraph = () => {
		if (paragraphLines.length === 0) return;
		const key = `p-${blocks.length}`;
		blocks.push(
			<Text key={key} style={styles.paragraph}>
				{paragraphLines.map((line, i) => (
					<React.Fragment key={`${key}-line-${i}`}>
						{i > 0 ? '\n' : null}
						{renderInline(line, `${key}-${i}`, theme.screen.text, linkColor)}
					</React.Fragment>
				))}
			</Text>,
		);
		paragraphLines = [];
	};

	lines.forEach((rawLine, index) => {
		const line = rawLine.trimEnd();
		const trimmed = line.trim();
		const key = `line-${index}`;

		if (trimmed === '') {
			flushParagraph();
			return;
		}

		if (/^-{3,}$/.test(trimmed)) {
			flushParagraph();
			blocks.push(<View key={key} style={[styles.hr, { backgroundColor: theme.screen.border }]} />);
			return;
		}

		const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
		if (headingMatch) {
			flushParagraph();
			const level = headingMatch[1].length;
			blocks.push(
				<Text key={key} style={[styles.heading, level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3, { color: theme.screen.text }]}>
					{headingMatch[2]}
				</Text>,
			);
			return;
		}

		const listMatch = /^[-*]\s+(.+)$/.exec(trimmed);
		if (listMatch) {
			flushParagraph();
			blocks.push(
				<View key={key} style={styles.listItem}>
					<Text style={[styles.bullet, { color: theme.screen.text }]}>{'•'}</Text>
					<Text style={styles.listItemText}>{renderInline(listMatch[1], key, theme.screen.text, linkColor)}</Text>
				</View>,
			);
			return;
		}

		paragraphLines.push(trimmed);
	});

	flushParagraph();

	return <View style={styles.container}>{blocks}</View>;
};

export default SimpleMarkdown;

const styles = StyleSheet.create({
	container: {
		paddingBottom: 24,
	},
	heading: {
		fontWeight: '700',
		marginTop: 20,
		marginBottom: 8,
	},
	h1: {
		fontSize: 24,
	},
	h2: {
		fontSize: 19,
	},
	h3: {
		fontSize: 16,
	},
	paragraph: {
		fontSize: 15,
		lineHeight: 22,
		marginBottom: 12,
	},
	link: {
		textDecorationLine: 'underline',
	},
	bold: {
		fontWeight: '700',
	},
	italic: {
		fontStyle: 'italic',
	},
	hr: {
		height: StyleSheet.hairlineWidth,
		marginVertical: 16,
	},
	listItem: {
		flexDirection: 'row',
		marginBottom: 8,
		paddingLeft: 4,
	},
	bullet: {
		fontSize: 15,
		marginRight: 8,
		lineHeight: 22,
	},
	listItemText: {
		flex: 1,
		fontSize: 15,
		lineHeight: 22,
	},
});
