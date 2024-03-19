import React, {FunctionComponent} from 'react';
import RenderHtml, {CustomTagRendererRecord} from 'react-native-render-html';
import {Icon, Text, getFontSizeInPixelBySize, View} from '@/components/Themed';

import {Linking, TouchableOpacity, useWindowDimensions} from 'react-native';
import {useTextContrastColor} from '@/components/Themed';

import MarkdownIt from 'markdown-it';
import {config} from '@gluestack-ui/config';
import {ExternalLinkIcon, MailIcon} from "@gluestack-ui/themed";
import {IconNames} from "@/constants/IconNames";
import {MyExternalLink} from "@/components/link/MyExternalLink";
import {MyButton} from "@/components/buttons/MyButton";
import {
	CustomBlockRenderer,
	CustomMixedRenderer,
	CustomTextualRenderer
} from "react-native-render-html/src/render/render-types";

interface AppState {
    darkmode?: boolean,
    hideSkeleton?: boolean,
    debug?: boolean,
    markdown?: string,
    color?: string,
    children?: string
}
export const ThemedMarkdown: FunctionComponent<AppState> = (props) => {
	let sourceContent: string = props?.markdown || props.children as string;

	const themedTextColor = useTextContrastColor();
	const textColor = props?.color || themedTextColor

	if (sourceContent===undefined && !props.hideSkeleton) {
		return <Text>{'Loading'}</Text>
	}

	/**
    let fontSize = theme["fontSizes"]["lg"]
    const emToPixel = (em: number) => {
        return em * fontSize;
    }
        */

	/**
    const fontWeightNormal = theme["fontWeights"]?.normal;
    const lineHeightNormalInEm = theme["lineHeights"]?.lg;
    const lineHeightNormal = emToPixel(parseFloat(lineHeightNormalInEm)) || 0;
        */

	const md = new MarkdownIt();

	const option_find_linebreaks = true;
	if (option_find_linebreaks) {
		sourceContent = sourceContent.replaceAll('<br/>', '\n');
		sourceContent = sourceContent.replaceAll('</br>', '\n');
		sourceContent = sourceContent.replaceAll('<br>', '\n');
		sourceContent = sourceContent.replaceAll('<p/>', '\n');
		sourceContent = sourceContent.replaceAll('</p>', '\n');
		sourceContent = sourceContent.replaceAll('<p>', '\n');
	}


	const result = md.render(sourceContent);

	const source = {
		html: result || ''
	};

	const { width } = useWindowDimensions();

	const tagsStyles = {
		'blockquote': {
			fontStyle: 'italic',
		},
		'td': {
			borderColor: 'gray',
			borderWidth: 1,
		},
		'th': {
			borderColor: 'gray',
			borderWidth: 1,
		},
		'a': {
			color: textColor
		}
	}

	const fontSize = getFontSizeInPixelBySize('md');

	const defaultTextProps = {
		selectable: true,
		color: textColor,
		fontSize: fontSize+'px',
		fontStyle: 'normal',
		//fontWeight: fontWeightNormal+"px", // as string because of iOS: NSNumber cannot be converted NSString
		//lineHeight: lineHeightNormal+"px", // as string because of iOS: NSNumber cannot be converted NSString
	};

	const customRenderers: Record<
		string,
		CustomBlockRenderer | CustomTextualRenderer | CustomMixedRenderer
	> = {
		"a": (props: any) => {

			const {href, ...restProps} = props.tnode.attributes;
			// get the "data" attribute from the node
			const {data} = props.tnode;
			const text = data || props.children[0]?.data;
			let icon = IconNames.open_link_icon
			if (href?.startsWith('tel:')) {
				icon = IconNames.phone_icon
			} else if (href?.startsWith('mailto:')) {
				icon = IconNames.mail_icon
			}
			// Return default renderer or your custom component
			return <MyButton accessibilityLabel={text} text={text} href={href} useOnlyNecessarySpace={true} leftIcon={icon} leftIconColoredBox={true} />

			/**
			const { href } = htmlAttribs;
			if (href.startsWith('tel:')) {
				// Handle phone links
				return (
					<TouchableOpacity onPress={() => Linking.openURL(href)}>
						<Icon name={"phone"} />
						<Text style={[{ color: textColor }]}>{children}</Text>
					</TouchableOpacity>
				);
			} else if (href.startsWith('mailto:')) {
				// Handle mail links
				return (
					<TouchableOpacity onPress={() => Linking.openURL(href)}>
						<MailIcon />
						<Text style={[{ color: textColor }]}>{children}</Text>
					</TouchableOpacity>
				);
			} else {
				// Handle regular links
				return (
					<TouchableOpacity onPress={() => Linking.openURL(href)} >
						<ExternalLinkIcon />
						<Text style={[{ color: textColor }]}>{children}</Text>
					</TouchableOpacity>
				);
			}
			*/
		}
	};

	if (props?.debug) {
		return (
		// @ts-ignore
			<Text selectable={true}>
				{result}
			</Text>
		)
	} else {
		return (
			<RenderHtml
				contentWidth={width}
				// @ts-ignore
				baseStyle={defaultTextProps}
				renderers={customRenderers}
				defaultTextProps={defaultTextProps}
				source={source}
			/>
		)
	}
}
