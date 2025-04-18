import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import LottieView from 'lottie-react-native';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { styles } from './styles';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useDispatch, useSelector } from 'react-redux';
import { formatPrice, showFormatedPrice } from '@/constants/HelperFunctions';
import { format } from 'date-fns';
import useMyCardReader, { MyCardReaderInterface } from './MyCardReader';
import { isWeb } from '@/constants/Constants';
import CardResponse from '@/helper/nfcCardReaderHelper/CardResponse';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useFocusEffect } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import useToast from '@/hooks/useToast';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import CustomCollapsible from '@/components/CustomCollapsible/CustomCollapsible';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import RedirectButton from '@/components/RedirectButton';
import { replaceLottieColors } from '@/helper/animationHelper';
import moneyConfused from '@/assets/animations/accountBalance/moneyConfused.json';
import moneyFitness from '@/assets/animations/accountBalance/moneyFitness.json';
import moneySad from '@/assets/animations/accountBalance/moneySad.json';
import moneyConfident from '@/assets/animations/accountBalance/moneyConfident.json';

enum BalanceStateLowerBound {
  CONFIDENT = 10,
  FITNESS = 3,
  SAD = 0,
  CONFUSED = -0.01,
}

const AccountBalanceScreen = () => {
  const toast = useToast();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const { profile } = useSelector((state: any) => state.authReducer);
  const { appSettings, language, primaryColor } = useSelector(
    (state: any) => state.settings
  );
  const mode = useSelector((state: any) => state.settings.theme);
  const balance_area_color = appSettings?.balance_area_color
    ? appSettings?.balance_area_color
    : primaryColor;
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  const [isNfcEnabled, setIsNfcEnabled] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [autoPlay, setAutoPlay] = useState(appSettings?.animations_auto_start);
  const animationRef = useRef<LottieView>(null);
  const nfcSheetRef = useRef<BottomSheet>(null);
  const nfcPoints = useMemo(() => ['80%'], []);
  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get('window').width
  );
  const [animationJson, setAmimationJson] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const title = 'Account Balance';
      document.title = title;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (profile?.credit_balance) {
        if (
          Number(profile?.credit_balance) >= BalanceStateLowerBound.CONFIDENT
        ) {
          setAmimationJson(
            replaceLottieColors(moneyConfident, balance_area_color)
          );
        } else if (
          Number(profile?.credit_balance) >= BalanceStateLowerBound.FITNESS
        ) {
          setAmimationJson(
            replaceLottieColors(moneyFitness, balance_area_color)
          );
        } else if (
          Number(profile?.credit_balance) >= BalanceStateLowerBound.SAD
        ) {
          setAmimationJson(replaceLottieColors(moneySad, balance_area_color));
        }
      } else {
        setAmimationJson(
          replaceLottieColors(moneyConfused, balance_area_color)
        );
      }
      return () => {
        setAmimationJson(null);
      };
    }, [profile?.credit_balance])
  );

  let myCardReader: MyCardReaderInterface = useMyCardReader();

  let callBack = async (answer: CardResponse | undefined) => {
    if (!answer) {
      return;
    }

    const nextBalanceAsString = answer.currentBalance;
    const nextBalanceDefined =
      nextBalanceAsString !== null && nextBalanceAsString !== undefined;

    const lastTransactionAsString = answer.lastTransaction;
    const lastTransactionDefined =
      lastTransactionAsString !== null && lastTransactionAsString !== undefined;

    dispatch({
      type: UPDATE_PROFILE,
      payload: {
        credit_balance: nextBalanceDefined
          ? parseFloat(nextBalanceAsString)
          : null,
        credit_balance_last_transaction: lastTransactionDefined
          ? parseFloat(lastTransactionAsString)
          : null,
        credit_balance_date_updated: answer?.readTime?.toISOString(),
      },
    });
  };

  const showInstruction = () => {
    nfcSheetRef.current?.expand();
  };

  const hideInstruction = () => {
    nfcSheetRef?.current?.close();
  };

  const onReadNfcPress = async () => {
    await myCardReader.readCard(
      callBack,
      showInstruction,
      hideInstruction,
      t('nfcInstructionRead')
    );
  };

  useEffect(() => {
    const onChange = ({ window }: { window: any }) => {
      setWindowWidth(window.width);
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => {
        setIsActive(false);
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const checkNfcStatus = async () => {
        try {
          const nfcAvailable = await myCardReader.isNfcSupported();
          setIsNfcSupported(nfcAvailable);

          const nfcEnabled = await myCardReader.isNfcEnabled();
          setIsNfcEnabled(nfcEnabled);
        } catch (error) {
          console.error('Error checking NFC status:', error);
        }
      };

      checkNfcStatus();
    }, [])
  );

  const getContent = () => {
    const emailRegex = /\[([^\]]+)]\((mailto:[^\)]+)\)/;
    const urlRegex = /\[([^\]]+)]\((https?:\/\/[^\)]+)\)/;

    if (appSettings?.balance_translations) {
      const rawText = getTextFromTranslation(
        appSettings?.balance_translations,
        language
      );
      const lines = rawText.split('\n').filter((line) => line.trim() !== '');

      // Function to get heading level (returns 1 for #, 2 for ##, 3 for ###)
      const getHeadingLevel = (line: any) => {
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith('#')) return 0;
        const matches = trimmedLine.match(/^#{1,3}/);
        return matches ? matches[0].length : 0;
      };

      // Function to process content into hierarchical structure
      const processContent = (lines: any) => {
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
      const renderTextWithLinks = (text: any, level: any, index: any) => {
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
            parts.push({
              type: 'link',
              linkText: match.text,
              url: match.url,
            });
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

      const renderContent = (items: any, level = 0) => {
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
                  customColor={balance_area_color}
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

  useFocusEffect(
    useCallback(() => {
      setAutoPlay(appSettings?.animations_auto_start); // Enable when entering

      return () => {
        setAutoPlay(false); // Reset when leaving
        setAmimationJson(null);
      };
    }, [appSettings?.animations_auto_start])
  );

  useEffect(() => {
    if (animationJson && autoPlay && animationRef.current) {
      animationRef?.current?.play(); // Reset animation to ensure it starts fresh
    }
  }, [animationJson, autoPlay]);

  const renderLottie = useMemo(() => {
    if (animationJson) {
      return (
        <LottieView
          ref={animationRef}
          source={animationJson ? animationJson : {}}
          resizeMode='contain'
          style={{ width: '100%', height: '100%' }}
          autoPlay={autoPlay}
          loop={false}
        />
      );
    }
  }, [autoPlay, animationJson]);

  return (
    <ScrollView
      style={{ ...styles.container, backgroundColor: theme.screen.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <View style={styles.imageContainer}>{renderLottie}</View>

      {/* Account Balance Info */}

      <Text style={{ ...styles.balanceTitle, color: theme.header.text }}>
        {t('accountbalance')}
      </Text>
      <Text style={{ ...styles.balance, color: theme.header.text }}>
        {profile?.credit_balance
          ? showFormatedPrice(formatPrice(profile?.credit_balance))
          : '? €'}
      </Text>
      {(isWeb || !isNfcSupported) && (
        <Text style={{ ...styles.subText, color: theme.header.text }}>
          {t('nfcNotSupported')}
        </Text>
      )}
      {!isWeb && isNfcEnabled && isNfcSupported && (
        <TouchableOpacity
          style={{ ...styles.nfcButton, borderColor: theme.screen.iconBg }}
          onPress={async () => {
            try {
              await onReadNfcPress();
            } catch (e: any) {
              toast(`${JSON.stringify(e)}`, 'error');
              console.error('Error', JSON.stringify(e));
            }
          }}
        >
          <MaterialCommunityIcons
            name='credit-card-wireless-outline'
            size={24}
            color={theme.screen.icon}
          />
          <Text style={{ ...styles.nfcLabel, color: theme.screen.text }}>
            {t('nfcReadCard')}
          </Text>
        </TouchableOpacity>
      )}
      {isNfcSupported && !isNfcEnabled && (
        <TouchableOpacity
          style={{ ...styles.nfcButton, borderColor: theme.screen.iconBg }}
          onPress={() => Linking.openSettings()} // Open NFC settings
        >
          <MaterialCommunityIcons
            name='nfc'
            size={24}
            color={theme.screen.icon}
          />
          <Text style={{ ...styles.nfcLabel, color: theme.screen.text }}>
            {t('pleaseEnableNFC')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Additional Information */}
      <View
        style={[
          styles.infoContainer,
          { width: windowWidth > 600 ? '90%' : '100%' },
        ]}
      >
        <View style={styles.infoRow}>
          <View style={styles.iconLabelContainer}>
            <MaterialCommunityIcons
              name='credit-card'
              size={24}
              color={theme.screen.icon}
              style={styles.icon}
            />
            <Text style={{ ...styles.label, color: theme.header.text }}>
              {t('accountbalance')}
            </Text>
          </View>

          <Text style={{ ...styles.value, color: theme.header.text }}>
            {profile?.credit_balance
              ? showFormatedPrice(formatPrice(profile?.credit_balance))
              : '? €'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.iconLabelContainer}>
            <MaterialCommunityIcons
              name='transfer'
              size={24}
              color={theme.screen.icon}
              style={styles.icon}
            />
            <Text style={{ ...styles.label, color: theme.header.text }}>
              {t('accountbalanceLastTransaction')}
            </Text>
          </View>
          <Text style={{ ...styles.value, color: theme.header.text }}>
            {profile?.credit_balance_last_transaction
              ? showFormatedPrice(
                  formatPrice(profile?.credit_balance_last_transaction)
                )
              : '? €'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.iconLabelContainer}>
            <FontAwesome5
              name='calendar-alt'
              size={24}
              color={theme.screen.icon}
              style={styles.icon}
            />
            <Text style={{ ...styles.label, color: theme.header.text }}>
              {t('accountbalanceDateUpdated')}
            </Text>
          </View>
          <Text style={{ ...styles.value, color: theme.header.text }}>
            {profile?.credit_balance_date_updated
              ? format(profile?.credit_balance_date_updated, 'dd.MM.yyyy HH:mm')
              : ''}
          </Text>
        </View>
        <View style={styles.additionalInfoContainer}>{getContent()}</View>
      </View>
      {isActive && (
        <BottomSheet
          ref={nfcSheetRef}
          index={-1}
          snapPoints={nfcPoints}
          backgroundStyle={{
            ...styles.sheetBackground,
            backgroundColor: theme.sheet.sheetBg,
          }}
          enablePanDownToClose
          handleComponent={null}
          backdropComponent={(props) => <BottomSheetBackdrop {...props} />}
        >
          <BottomSheetView>
            <View
              style={{
                ...styles.sheetHeader,
              }}
            >
              <View />
              <Text
                style={{
                  ...styles.sheetHeading,
                  fontSize: 28,
                  color: theme.sheet.text,
                }}
              >
                NFC
              </Text>
              <TouchableOpacity
                style={{
                  ...styles.sheetcloseButton,
                  backgroundColor: theme.sheet.closeBg,
                }}
                onPress={hideInstruction}
              >
                <AntDesign
                  name='close'
                  size={24}
                  color={theme.sheet.closeIcon}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetView}>
              <Text
                style={{
                  ...styles.nfcInstructionRead,
                  color: theme.screen.text,
                }}
              >
                {t('nfcInstructionRead')}
              </Text>
              <View
                style={{
                  width: 400,
                  height: 400,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <LottieView
                  source={require('@/assets/gifs/nfc.json')}
                  resizeMode='contain'
                  style={{ width: '100%', height: '100%' }}
                  autoPlay
                  loop
                />
              </View>
            </View>
          </BottomSheetView>
        </BottomSheet>
      )}
    </ScrollView>
  );
};

export default AccountBalanceScreen;
