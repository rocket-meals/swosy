import React from 'react';
import { Linking, Text, View, useWindowDimensions } from 'react-native';
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import MarkdownIt from 'markdown-it';
import { lightTheme, darkTheme } from "@/styles/themes";
import { Appearance } from "react-native";
import RenderHtml, {
  CustomBlockRenderer,
  CustomMixedRenderer,
  CustomTextualRenderer,
  HTMLElementModel,
  HTMLContentModel,
} from 'react-native-render-html';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import ProjectButton from '../ProjectButton';
import { myContrastColor } from '@/helper/colorHelper';

export interface MyMarkdownProps {
  content: string;
}

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
};

const MyMarkdown: React.FC<MyMarkdownProps> = ({ content }) => {
  const { primaryColor, selectedTheme } = useSelector(
    (state: RootState) => state.settings
  );

  const colorScheme = Appearance.getColorScheme();
  const theme =
    selectedTheme === "systematic"
      ? colorScheme === "dark"
        ? darkTheme
        : lightTheme
      : selectedTheme === "dark"
      ? darkTheme
      : lightTheme;

  const { width } = useWindowDimensions();
  const md = new MarkdownIt({ html: true });

  let sourceContent = content || '';
  const option_find_linebreaks = true;
  if (option_find_linebreaks) {
    sourceContent = replaceLinebreaks(sourceContent);
  }

  const result = md.render(sourceContent);
  const source = { html: result || '' };

  const fontSize = 16;
  const textColor = theme.sheet.text;
  const contrastColor = myContrastColor(primaryColor, theme, selectedTheme === 'dark');

  const tagsStyles = {
    blockquote: { fontStyle: 'italic' },
    td: { borderColor: 'gray', borderWidth: 1 },
    th: { borderColor: 'gray', borderWidth: 1 },
    a: { color: textColor },
  } as const;

  const customHTMLElementModels = {
    sub: HTMLElementModel.fromCustomModel({
      tagName: 'sub',
      mixedUAStyles: { fontSize: '75%' },
      contentModel: HTMLContentModel.textual,
    }),
    sup: HTMLElementModel.fromCustomModel({
      tagName: 'sup',
      mixedUAStyles: { fontSize: '75%' },
      contentModel: HTMLContentModel.textual,
    }),
  };

  const defaultTextProps = {
    selectable: true,
    color: textColor,
    fontSize,
    fontStyle: 'normal',
  };

  const customRenderers: Record<string, CustomBlockRenderer | CustomTextualRenderer | CustomMixedRenderer> = {
    a: (props: any) => {
      const { href } = props.tnode.attributes;
      const { data } = props.tnode;
      const text = data || props.children[0]?.data;

      const handlePress = () => {
        if (href) {
          Linking.openURL(href).catch((err) =>
            console.error('Failed to open URL:', err)
          );
        }
      };

      let iconLeft = (
        <FontAwesome6
          name='arrow-up-right-from-square'
          size={20}
          color={contrastColor}
        />
      );

      if (href?.startsWith('tel:')) {
        iconLeft = (
          <FontAwesome6 name='phone' size={20} color={contrastColor} />
        );
      } else if (href?.startsWith('mailto:')) {
        iconLeft = (
          <MaterialCommunityIcons name='email' size={24} color={contrastColor} />
        );
      }

      return (
        <ProjectButton text={text} onPress={handlePress} iconLeft={iconLeft} />
      );
    },
    sub: (props: any) => {
      const { data } = props.tnode;
      const text = data || props.children[0]?.data;
      return (
        <Text style={{ fontSize: fontSize * 0.75, verticalAlign: 'sub', color: textColor }}>
          {text}
        </Text>
      );
    },
    sup: (props: any) => {
      const { data } = props.tnode;
      const text = data || props.children[0]?.data;
      return (
        <Text style={{ fontSize: fontSize * 0.75, verticalAlign: 'super', color: textColor }}>
          {text}
        </Text>
      );
    },
  };

  return (
    <View>
      <RenderHtml
        contentWidth={width}
        // @ts-ignore
        baseStyle={defaultTextProps}
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
