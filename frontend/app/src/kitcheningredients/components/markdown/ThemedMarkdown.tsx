import React, {FunctionComponent} from "react";
import {Text, useColorMode, useTheme} from "native-base";
import RenderHtml from 'react-native-render-html';

import {MarkdownSkeleton} from "./MarkdownSkeleton";
import {useWindowDimensions} from "react-native";

const MarkdownIt = require('markdown-it');

interface AppState {
	darkmode?: boolean,
  hideSkeleton?: boolean,
  debug?: boolean,
  markdown?: string,
  color?: string
}
export const ThemedMarkdown: FunctionComponent<AppState> = (props) => {

  let sourceContent: string = props?.markdown || props.children as string;

  if(sourceContent===undefined && !props.hideSkeleton){
    return <MarkdownSkeleton />
  }

	const { colorMode, toggleColorMode } = useColorMode();
	let darkMode = colorMode!=="light";
	if(props.darkmode !== undefined){
		darkMode = props.darkmode
	}

	const theme = useTheme();

	let darkModeTextColor = theme["colors"]["lightText"]; //darkText is used in lightmode !
	let lightModeTextColor = theme["colors"]["darkText"];

	let textColor = darkMode ? darkModeTextColor : lightModeTextColor;
	if(props?.color){
	  textColor = props?.color;
    }
	let fontSize = theme["fontSizes"]["lg"]

  const emToPixel = (em: number) => {
	      return em * fontSize;
  }

  const fontWeightNormal = theme["fontWeights"]?.normal;
	const lineHeightNormalInEm = theme["lineHeights"]?.lg;
	const lineHeightNormal = emToPixel(parseFloat(lineHeightNormalInEm)) || 0;

  const md = new MarkdownIt();

  let option_find_linebreaks = true;
  if(option_find_linebreaks){
    sourceContent = sourceContent.replaceAll("<br/>", "\n");
    sourceContent = sourceContent.replaceAll("</br>", "\n");
    sourceContent = sourceContent.replaceAll("<br>", "\n");
    sourceContent = sourceContent.replaceAll("<p/>", "\n");
    sourceContent = sourceContent.replaceAll("</p>", "\n");
    sourceContent = sourceContent.replaceAll("<p>", "\n");
  }


  const result = md.render(sourceContent);

  const source = {
    html: result || ""
  };

  const { width } = useWindowDimensions();

  const tagsStyles = {
    "blockquote": {
      fontStyle: "italic",
    },
    "td": {
      borderColor: "gray",
      borderWidth: 1,
    },
    "th": {
      borderColor: "gray",
      borderWidth: 1,
    },
    "a": {
      color: textColor
    }
  }

  const defaultTextProps = {
    selectable: true,
    color: textColor,
    fontSize: fontSize+"px",
    fontStyle: "normal",
    fontWeight: fontWeightNormal+"px", // as string because of iOS: NSNumber cannot be converted NSString
    lineHeight: lineHeightNormal+"px", // as string because of iOS: NSNumber cannot be converted NSString
  };

  if(props?.debug) {
    return (
      // @ts-ignore
      <Text selectable={true}>
        {result}
      </Text>
    )
  } else {
    return(
      <RenderHtml
        contentWidth={width}
        // @ts-ignore
        baseStyle={defaultTextProps}
        // @ts-ignore
        defaultTextProps={defaultTextProps}
        // @ts-ignore
        tagsStyles={tagsStyles}
        source={source}
      />
    )
  }
}
