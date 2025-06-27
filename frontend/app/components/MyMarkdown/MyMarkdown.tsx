import React from 'react';
import { Linking, Text, View, useWindowDimensions } from 'react-native';
import MarkdownIt from 'markdown-it';
import RenderHtml, {
  CustomBlockRenderer,
  CustomMixedRenderer,
  CustomTextualRenderer,
  HTMLElementModel,
  HTMLContentModel,
} from 'react-native-render-html';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import RedirectButton from '../RedirectButton';
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
  const { theme } = useTheme();
  const { primaryColor, selectedTheme } = useSelector(
    (state: RootState) => state.settings
  );

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
    fontSize: fontSize + 'px',
    fontStyle: 'normal',
  };

  const customRenderers: Record<string, CustomBlockRenderer | CustomTextualRenderer | CustomMixedRenderer> = {
    a: (props: any) => {
      const { href } = props.tnode.attributes;
      const { data } = props.tnode;
      const text = data || props.children[0]?.data;
      const type = href?.startsWith('mailto:') ? 'email' : 'link';

      const handlePress = () => {
        if (href) {
          Linking.openURL(href).catch((err) => console.error('Failed to open URL:', err));
        }
      };

      return (
        <RedirectButton
          type={type}
          label={text}
          onClick={handlePress}
          backgroundColor={primaryColor}
          color={contrastColor}
        />
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
