import React, {FunctionComponent} from 'react';
import RenderHtml from 'react-native-render-html';
import { Text, getFontSizeInPixelBySize} from '@/components/Themed';

import {useWindowDimensions} from 'react-native';
import {useTextContrastColor} from '@/components/Themed';

import MarkdownIt from 'markdown-it';
import {config} from '@gluestack-ui/config';

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

	console.log('config: ', config)

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
				defaultTextProps={defaultTextProps}
				source={source}
			/>
		)
	}
}
