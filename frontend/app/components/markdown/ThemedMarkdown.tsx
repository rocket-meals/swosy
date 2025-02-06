import React, {FunctionComponent} from 'react';
import RenderHtml, {HTMLContentModel, HTMLElementModel} from 'react-native-render-html';
import {getFontSizeInPixelBySize, Text, useTextContrastColor, View} from '@/components/Themed';

import {useWindowDimensions} from 'react-native';

import MarkdownIt from 'markdown-it';
import {IconNames} from "@/constants/IconNames";
import {MyButton} from "@/components/buttons/MyButton";
import {
	CustomBlockRenderer,
	CustomMixedRenderer,
	CustomTextualRenderer
} from "react-native-render-html/src/render/render-types";

export const MARKDOWN_EXAMPLE = `## Markdown Example

Here comes some more ***important*** information in a rich text format. Lorem markdownum iura! Unda quid, quid iuro viscera nec terras undis illa tectis
belloque vigil et educere Boote. Cum ubi aut bracchiaque quod: Iuppiter quaque.
Haec tuta libratus perstant levat stant imperat nitore abductas captat iacet
dignissima virgine posse coniectum suspiria, scilicet caelestia, cape.

## Links
[Rocket Meals](https://rocket-meals.de)
`

export const replaceLinebreaks = (sourceContent: string) => {
	const option_find_linebreaks = true;
	if (option_find_linebreaks) {
		sourceContent = sourceContent.replaceAll('<br/>', '\n');
		sourceContent = sourceContent.replaceAll('</br>', '\n');
		sourceContent = sourceContent.replaceAll('<br>', '\n');
		sourceContent = sourceContent.replaceAll('<p/>', '\n');
		sourceContent = sourceContent.replaceAll('</p>', '\n');
		sourceContent = sourceContent.replaceAll('<p>', '\n');
	}
	return sourceContent;
}

interface AppState {
    darkmode?: boolean,
    hideSkeleton?: boolean,
    debug?: boolean,
    markdown?: string,
    color?: string,
	buttonAndLinkColor?: string,
    children?: string
}
export const ThemedMarkdown: FunctionComponent<AppState> = (props) => {
	let sourceContent: string = props?.markdown || props.children as string;
	const buttonAndLinkColor = props.buttonAndLinkColor

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

	const md = new MarkdownIt({ html: true });

	const option_find_linebreaks = true;
	if (option_find_linebreaks) {
		sourceContent = replaceLinebreaks(sourceContent);
	}


	console.log("Source Content", sourceContent)



	const result = md.render(sourceContent);
	console.log("Result", result)


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

	const customHTMLElementModels = {
		'sub': HTMLElementModel.fromCustomModel({
			tagName: 'sub',
			mixedUAStyles: {
				fontSize: '75%',  // Reduce font size
				//verticalAlign: 'sub'
			},
			contentModel: HTMLContentModel.textual
		}),
		'sup': HTMLElementModel.fromCustomModel({
			tagName: 'sup',
			mixedUAStyles: {
				fontSize: '75%',  // Reduce font size
				//verticalAlign: 'super'
			},
			contentModel: HTMLContentModel.textual
		})
	};


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
			return <View>
				<MyButton backgroundColor={buttonAndLinkColor} accessibilityLabel={text} text={text} href={href} useOnlyNecessarySpace={true} leftIcon={icon} leftIconColoredBox={true} />
			</View>
		},
		"sub": (props: any) => {
			const {data} = props.tnode;
			const text = data || props.children[0]?.data;

			return (
				<Text style={{ fontSize: fontSize * 0.75, verticalAlign: 'sub' }}>
					{text}
				</Text>
			);
		},
		"sup": (props: any) => {
			const {data} = props.tnode;
			const text = data || props.children[0]?.data;

			return (
				<Text style={{ fontSize: fontSize * 0.75, verticalAlign: 'super' }}>
					{text}
				</Text>
			);
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
			<View>
				<RenderHtml
					contentWidth={width}
					// @ts-ignore
					baseStyle={defaultTextProps}
					renderers={customRenderers}
					defaultTextProps={defaultTextProps}
					customHTMLElementModels={customHTMLElementModels}
					key={source+""+buttonAndLinkColor}
					source={source}
				/>
			</View>
		)
	}
}
