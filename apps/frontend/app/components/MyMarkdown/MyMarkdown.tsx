import React from 'react';
import { Appearance, Linking, Text, useWindowDimensions, View } from 'react-native';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MarkdownIt from 'markdown-it';
import { darkTheme, lightTheme } from '@/styles/themes';
import RenderHtml, { CustomBlockRenderer, CustomMixedRenderer, CustomTextualRenderer, HTMLContentModel, HTMLElementModel } from 'react-native-render-html';
import { useAppSelector } from '@/redux/hooks';
import ProjectButton from '../ProjectButton';
import { myContrastColor } from '@/helper/ColorHelper';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';
import { StringHelper } from 'repo-depkit-common';
import { UriScheme } from '@/constants/UriScheme';
import { resolveLocationHref } from '@/helper/MarkdownLinkHelper';

export interface MyMarkdownProps {
	content: string;
	textColor?: string;
}

// CommonMark link destinations can't contain a raw, unescaped space, so a
// `[text](geo:52.1, 8.0)`-style link (space after the comma) silently fails to
// parse as a link and falls through as literal text. Location links are the
// only ones content authors realistically write with a space in the
// coordinates, so strip whitespace from just those destinations before parsing.
const LOCATION_LINK_DESTINATION_PATTERN = new RegExp(String.raw`\((${UriScheme.GEO}|${UriScheme.MAPS}|latlon:)([^)]*)\)`, 'gi');

export const sanitizeLocationLinkWhitespace = (sourceContent: string) =>
	sourceContent.replace(LOCATION_LINK_DESTINATION_PATTERN, (_match, scheme, coordinates) => `(${scheme}${coordinates.replace(/\s+/g, '')})`);

function openLinkSafely(url: string) {
	Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
}

export const replaceLinebreaks = (sourceContent: string) => {
	const option_find_linebreaks = true;
	if (option_find_linebreaks) {
		sourceContent = StringHelper.replaceAllLiteralWithOptions({ str: sourceContent, find: String.raw`\n`, replace: '\n' });
		sourceContent = StringHelper.replaceAllLiteralWithOptions({ str: sourceContent, find: String.raw`\r\n`, replace: '\n' });
		sourceContent = StringHelper.replaceAllLiteralWithOptions({ str: sourceContent, find: '<br/>', replace: '\n' });
		sourceContent = StringHelper.replaceAllLiteralWithOptions({ str: sourceContent, find: '</br>', replace: '\n' });
		sourceContent = StringHelper.replaceAllLiteralWithOptions({ str: sourceContent, find: '<br>', replace: '\n' });
		sourceContent = StringHelper.replaceAllLiteralWithOptions({ str: sourceContent, find: '<p/>', replace: '\n' });
		sourceContent = StringHelper.replaceAllLiteralWithOptions({ str: sourceContent, find: '</p>', replace: '\n' });
		sourceContent = StringHelper.replaceAllLiteralWithOptions({ str: sourceContent, find: '<p>', replace: '\n' });
	}
	return sourceContent;
};

function makeLinkRenderer(contrastColor: string): CustomBlockRenderer {
	return (props: any) => {
		const { href } = props.tnode.attributes;
		const { data } = props.tnode;
		const text = data || props.children[0]?.data;

		const hrefLower = href?.toLowerCase() ?? '';
		const isLatLonLink = hrefLower.startsWith('latlon:');
		const isLocationLink = isLatLonLink || hrefLower.startsWith(UriScheme.GEO) || hrefLower.startsWith(UriScheme.MAPS);

		let finalHref = href;
		if (isLatLonLink) {
			const coordinateString = href.slice('latlon:'.length);
			const [latitudeRaw, longitudeRaw] = coordinateString.split(',');

			const latitude = Number.parseFloat(latitudeRaw?.trim() ?? '');
			const longitude = Number.parseFloat(longitudeRaw?.trim() ?? '');

			if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
				finalHref = CommonSystemActionHelper.getGoogleMapsUrl(latitude, longitude);
			}
		} else if (isLocationLink) {
			const { resolvedHref } = resolveLocationHref(href);
			finalHref = resolvedHref ?? href;
		}

		const handlePress = () => {
			if (finalHref) {
				openLinkSafely(finalHref);
			}
		};

		let iconLeft = <FontAwesome6 name="arrow-up-right-from-square" size={20} color={contrastColor} />;

		if (finalHref?.startsWith('tel:')) {
			iconLeft = <FontAwesome6 name="phone" size={20} color={contrastColor} />;
		} else if (finalHref?.startsWith('mailto:')) {
			iconLeft = <MaterialCommunityIcons name="email" size={24} color={contrastColor} />;
		} else if (isLocationLink) {
			iconLeft = <Ionicons name="navigate" size={24} color={contrastColor} />;
		}

		return <ProjectButton text={text} onPress={handlePress} iconLeft={iconLeft} />;
	};
}

function makeSubRenderer(fontSize: number, textColor: string): CustomTextualRenderer {
	return (props: any) => {
		const { data } = props.tnode;
		const text = data || props.children[0]?.data;
		return <Text style={{ fontSize: fontSize * 0.8, lineHeight: fontSize, textAlignVertical: 'bottom', color: textColor }}>{text}</Text>;
	};
}

function makeSupRenderer(fontSize: number, textColor: string): CustomTextualRenderer {
	return (props: any) => {
		const { data } = props.tnode;
		const text = data || props.children[0]?.data;
		return <Text style={{ fontSize: fontSize * 0.8, lineHeight: fontSize * 1.5, textAlignVertical: 'top', color: textColor }}>{text}</Text>;
	};
}

const MyMarkdown: React.FC<MyMarkdownProps> = ({ content, textColor: textColorProp }) => {
	const { primaryColor, selectedTheme } = useAppSelector((state) => state.settings);

	const colorScheme = Appearance.getColorScheme();
	let theme = lightTheme;
	if (selectedTheme === 'systematic') {
		theme = colorScheme === 'dark' ? darkTheme : lightTheme;
	} else if (selectedTheme === 'dark') {
		theme = darkTheme;
	}

	const { width } = useWindowDimensions();
	const md = new MarkdownIt({ html: true, breaks: true });

	let sourceContent = content || '';
	const option_find_linebreaks = true;
	if (option_find_linebreaks) {
		sourceContent = replaceLinebreaks(sourceContent);
	}
	sourceContent = sanitizeLocationLinkWhitespace(sourceContent);

	const result = md.render(sourceContent);
	const source = { html: result || '' };

	const fontSize = 16;
	const textColor = textColorProp ?? theme.sheet.text;
	const contrastColor = myContrastColor(primaryColor, theme, selectedTheme === 'dark');

	const customHTMLElementModels = React.useMemo(() => ({
		sub: HTMLElementModel.fromCustomModel({
			tagName: 'sub',
			contentModel: HTMLContentModel.textual,
		}),
		sup: HTMLElementModel.fromCustomModel({
			tagName: 'sup',
			contentModel: HTMLContentModel.textual,
		}),
	}), []);

	const baseStyle = React.useMemo(() => ({
		color: textColor,
		fontSize,
		fontStyle: 'normal' as const,
	}), [textColor, fontSize]);

	const defaultTextProps = React.useMemo(() => ({
		selectable: true,
	}), []);

	const tagsStyles = React.useMemo(() => ({
		blockquote: { fontStyle: 'italic' } as const,
		td: { borderColor: 'gray', borderWidth: 1 } as const,
		th: { borderColor: 'gray', borderWidth: 1 } as const,
		a: { color: textColor } as const,
	}), [textColor]);

	const customRenderers = React.useMemo(() => {
		const renderers: Record<string, CustomBlockRenderer | CustomTextualRenderer | CustomMixedRenderer> = {
			a: makeLinkRenderer(contrastColor),
			sub: makeSubRenderer(fontSize, textColor),
			sup: makeSupRenderer(fontSize, textColor),
		};
		return renderers;
	}, [textColor, fontSize, contrastColor]);

	return (
		<View>
			<RenderHtml
				contentWidth={width}
				baseStyle={baseStyle}
				renderers={customRenderers}
				defaultTextProps={defaultTextProps}
				customHTMLElementModels={customHTMLElementModels}
				tagsStyles={tagsStyles}
				source={source}
			/>
		</View>
	);
};

export default MyMarkdown;
