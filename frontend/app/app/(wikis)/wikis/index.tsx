import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import {
  getTextFromTranslation,
  getTitleFromTranslation,
} from '@/helper/resourceHelper';
import CustomCollapsible from '@/components/CustomCollapsible/CustomCollapsible';
import { Linking } from 'react-native';
import RedirectButton from '@/components/RedirectButton';
import {
  router,
  useGlobalSearchParams,
  useLocalSearchParams,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isWeb } from '@/constants/Constants';
import DeviceMock from '@/components/DeviceMock/DeviceMock';
import useSetPageTitle from '@/hooks/useSetPageTitle';

const index = () => {
  const { theme } = useTheme();
  const [wiki, setWiki] = useState<any>();
  const [loading, setLoading] = useState(false);
  const { wikis, language } = useSelector((state: any) => state.settings);
  const { deviceMock } = useGlobalSearchParams();
  const { custom_id, id } = useLocalSearchParams();
  //Set Page Title
  const title = wiki?.translations
    ? getTitleFromTranslation(wiki?.translations, language)
    : 'Wikis';
  useSetPageTitle(title);

  const filterWiki = () => {
    setLoading(true);
    const wiki_data = wikis?.filter(
      (wiki: any) => wiki?.custom_id === custom_id
    );
    if (wiki_data) {
      setWiki(wiki_data[0]);
    }
    setLoading(false);
  };

  const filterWikiWithId = () => {
    setLoading(true);
    const wiki_data = wikis?.filter((wiki: any) => wiki?.id === id);
    if (wiki_data) {
      setWiki(wiki_data[0]);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (wikis && custom_id) {
      filterWiki();
    }
  }, [wikis, custom_id]);

  useEffect(() => {
    if (wikis && id) {
      filterWikiWithId();
    }
  }, [wikis, id]);

  const getContent = () => {
    const emailRegex = /\[([^\]]+)]\((mailto:[^\)]+)\)/;
    const urlRegex = /\[([^\]]+)]\((https?:\/\/[^\)]+)\)/;

    if (wiki) {
      const rawText = getTextFromTranslation(wiki.translations, language);
      const lines = rawText.split('\n').filter((line) => line.trim() !== '');

      // Function to get heading level (returns 1 for #, 2 for ##, 3 for ###)
      const getHeadingLevel = (line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith('#')) return 0;
        const matches = trimmedLine.match(/^#{1,3}/);
        return matches ? matches[0].length : 0;
      };

      // Function to process content into hierarchical structure
      const processContent = (lines) => {
        const result = [];
        let stack = [{ level: 0, items: result }];
        let currentContent = '';

        lines.forEach((line) => {
          const level = getHeadingLevel(line);
          if (level > 0) {
            if (currentContent.trim()) {
              stack[stack.length - 1].items.push({
                type: 'text',
                content: currentContent.trim(),
              });
              currentContent = '';
            }

            // Find appropriate parent level
            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
              stack.pop();
            }

            const newSection = {
              type: 'collapsible',
              header: line.replace(/#/g, '').trim(),
              items: [],
              level,
            };
            stack[stack.length - 1].items.push(newSection);
            stack.push({ level, items: newSection.items });
          } else if (/(\t{1,2})/.test(line)) {
            // Add indented content to current section
            currentContent += `${line}\n`;
          } else {
            if (emailRegex.test(line)) {
              stack[stack.length - 1].items.push({
                type: 'email',
                content: line,
              });
            } else if (urlRegex.test(line)) {
              stack[stack.length - 1].items.push({
                type: 'link',
                content: line,
              });
            } else {
              stack[stack.length - 1].items.push({
                type: 'text',
                content: `${line}\n`,
              });
            }
          }
        });

        // Add any remaining content
        if (currentContent.trim()) {
          stack[stack.length - 1].items.push({
            type: 'text',
            content: currentContent.trim(),
          });
        }

        return result;
      };
      const renderTextWithLinks = (text, level, index) => {
        const parts = [];
        let currentText = text;
        let offset = 0;

        // Find all matches first
        const allMatches = [];

        // Find markdown links
        const linkRegex = /\[([^\]]+)]\((https?:\/\/[^\)]+)\)/g;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(text)) !== null) {
          allMatches.push({
            type: 'link',
            text: linkMatch[1],
            url: linkMatch[2],
            index: linkMatch.index,
            length: linkMatch[0].length,
          });
        }

        // Find markdown emails
        const emailRegex = /\[([^\]]+)]\(mailto:([^\)]+)\)/g;
        let emailMatch;
        while ((emailMatch = emailRegex.exec(text)) !== null) {
          allMatches.push({
            type: 'email',
            text: emailMatch[1],
            email: emailMatch[2],
            index: emailMatch.index,
            length: emailMatch[0].length,
          });
        }

        // Sort matches by index
        allMatches.sort((a, b) => a.index - b.index);

        // Process matches in order
        let lastIndex = 0;
        allMatches.forEach((match) => {
          // Add text before match
          if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
          }

          if (match.type === 'link') {
            parts.push({ type: 'link', linkText: match.text, url: match.url });
          } else {
            parts.push({
              type: 'email',
              emailText: match.text,
              email: match.email,
            });
          }

          lastIndex = match.index + match.length;
        });

        // Add remaining text
        if (lastIndex < text.length) {
          parts.push(text.slice(lastIndex));
        }

        return (
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Poppins_400Regular',
              color: theme.screen.text,
              marginLeft: level * 16,
            }}
          >
            {parts.map((part, idx) => {
              if (typeof part === 'object') {
                if (part.type === 'link') {
                  return (
                    <TouchableOpacity key={`link-${level}-${index}-${idx}`}>
                      <RedirectButton
                        type='link'
                        label={part.linkText}
                        onClick={() => Linking.openURL(part.url)}
                        backgroundColor={wiki.color || ''}
                      />
                    </TouchableOpacity>
                  );
                }
                if (part.type === 'email') {
                  console.log(part, 'letemail');
                  return (
                    <TouchableOpacity key={`email-${level}-${index}-${idx}`}>
                      <RedirectButton
                        type='email'
                        label={part.emailText}
                        onClick={() => Linking.openURL(`mailto:${part.email}`)}
                        backgroundColor={wiki.color || ''}
                      />
                    </TouchableOpacity>
                  );
                }
              }
              return part;
            })}
          </Text>
        );
      };

      const renderContent = (items, level = 0) => {
        return items.map((item, index) => {
          if (item.type === 'text') {
            const urlRegex = /(https?:\/\/[^\s]+)/g;

            // Extract links from the text
            const links = item.content.match(urlRegex) || [];

            // Split the item.content to separate links and non-links
            const parts = item.content.split(urlRegex); // This will split the text into an array of regular text and links.

            return (
              <View key={`text-wrapper-${level}-${index}`}>
                {renderTextWithLinks(item.content, level, index)}
              </View>
            );
          } else if (item.type === 'email') {
            const matches = item.content.match(emailRegex);
            const emailDisplay = matches[1];
            const mailtoLink = matches[2];
            return (
              <TouchableOpacity
                key={`email-${level}-${index}`}
                style={{ marginLeft: level * 16 }}
              >
                <RedirectButton
                  type={'email'}
                  label={emailDisplay}
                  onClick={() => Linking.openURL(mailtoLink)}
                  backgroundColor={wiki.color || ''}
                />
              </TouchableOpacity>
            );
          } else if (item.type === 'link') {
            const matches = item.content.match(urlRegex);
            const displayText = matches[1];
            const url = matches[2];
            return (
              <TouchableOpacity
                key={`link-${level}-${index}`}
                style={{ marginLeft: level * 16 }}
              >
                <RedirectButton
                  type={'link'}
                  label={displayText}
                  onClick={() => Linking.openURL(url)}
                  backgroundColor={wiki.color || ''}
                />
              </TouchableOpacity>
            );
          } else if (item.type === 'collapsible') {
            return (
              <View
                key={`collapsible-${level}-${index}`}
                style={{ marginTop: 10 }}
              >
                <CustomCollapsible
                  headerText={item.header}
                  customColor={wiki.color || ''}
                >
                  {renderContent(item.items, level + 1)}
                </CustomCollapsible>
              </View>
            );
          }
        });
      };

      const hierarchicalContent = processContent(lines);

      return <View>{renderContent(hierarchicalContent)}</View>;
    }

    return null;
  };
  return (
    <ScrollView
      style={{ ...styles.container, backgroundColor: theme.screen.background }}
    >
      {deviceMock && deviceMock === 'iphone' && isWeb && <DeviceMock />}
      <View
        style={{
          ...styles.header,
          backgroundColor: theme.header.background,
          paddingHorizontal: isWeb ? 20 : 10,
        }}
      >
        <View style={styles.row}>
          <View style={styles.col1}>
            <TouchableOpacity
              onPress={() => router.navigate('/foodoffers')}
              style={{ padding: 10 }}
            >
              <Ionicons name='arrow-back' size={24} color={theme.header.text} />
            </TouchableOpacity>
            <Text style={{ ...styles.heading, color: theme.header.text }}>
              {wiki?.translations &&
                getTitleFromTranslation(wiki?.translations, language)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.content}>
        {loading ? (
          <View
            style={{
              height: 200,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size={30} color={theme.screen.text} />
          </View>
        ) : (
          getContent()
        )}
      </View>
    </ScrollView>
  );
};

export default index;
