import { Dimensions, Image, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import styles from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { format, parseISO } from 'date-fns';
import { getNewsTranslationByLanguageCode } from '@/helper/resourceHelper';
import useToast from '@/hooks/useToast';
import { useLanguage } from '@/hooks/useLanguage';
import { myContrastColor } from '@/helper/ColorHelper';
import { CustomTooltip, TooltipContent, TooltipText } from '@/components/CustomTooltip';
import { TranslationKeys } from '@/locales/keys';

const ReadMoreTriggerButton = ({
	triggerProps,
	onPress,
	backgroundColor,
	textColor,
	width,
	label,
}: {
	triggerProps: object;
	onPress: () => void;
	backgroundColor: string;
	textColor: string;
	width: number | string;
	label: string;
}) => (
	<TouchableOpacity
		{...triggerProps}
		style={{
			...styles.readMoreButton,
			backgroundColor,
			width,
		}}
		onPress={onPress}
	>
		<Text style={{ ...styles.readMore, color: textColor }}>{label}</Text>
		<FontAwesome6 name="arrow-up-right-from-square" size={20} color={textColor} />
	</TouchableOpacity>
);

const makeReadMoreTrigger = (props: Readonly<{
	onPress: () => void;
	backgroundColor: string;
	textColor: string;
	width: number | string;
	label: string;
}>) => (triggerProps: object) => <ReadMoreTriggerButton triggerProps={triggerProps} {...props} />;

const NEWS_ITEM_WIDE_BREAKPOINT = 768;
const NEWS_ITEM_EXTRA_WIDE_BREAKPOINT = 900;

/**
 * Resolves all the screenWidth-dependent layout values used by NewsItem's
 * JSX, so the `screenWidth > 768` breakpoint check isn't repeated ~10x.
 */
function resolveNewsItemLayout(screenWidth: number) {
	const isWide = screenWidth > NEWS_ITEM_WIDE_BREAKPOINT;

	let imageContainerWidth: '20%' | '30%' | '100%' = '100%';
	if (isWide) {
		imageContainerWidth = screenWidth > NEWS_ITEM_EXTRA_WIDE_BREAKPOINT ? '20%' : '30%';
	}
	let newsContentWidth: '79%' | '69%' | '100%' = '100%';
	if (isWide) {
		newsContentWidth = screenWidth > NEWS_ITEM_EXTRA_WIDE_BREAKPOINT ? '79%' : '69%';
	}

	return {
		imageContainerWidth,
		newsContentWidth,
		cardFlexDirection: isWide ? ('row' as const) : ('column' as const),
		imageHeight: isWide ? 220 : 180,
		contentJustifyContent: isWide ? ('space-between' as const) : ('flex-start' as const),
		contentPadding: isWide ? 10 : 0,
		headerMarginTop: isWide ? 10 : 5,
		headerFlexDirection: isWide ? ('row' as const) : ('column' as const),
		titleWidth: isWide ? ('80%' as const) : ('100%' as const),
		dateWidth: isWide ? ('20%' as const) : ('100%' as const),
		actionAlignItems: isWide ? ('flex-start' as const) : ('center' as const),
		readMoreWidth: isWide ? (210 as number | string) : '100%',
	};
}

const NewsItem: React.FC<any> = ({ news }) => {
	const { theme } = useTheme();
	const toast = useToast();
	const { translate } = useLanguage();
	const { primaryColor, language, appSettings, selectedTheme: mode } = useAppSelector(state => state.settings);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	const { title, content } = getNewsTranslationByLanguageCode(news?.translations, language);
	const news_area_color = appSettings?.news_area_color ? appSettings?.news_area_color : primaryColor;
	const contrastColor = myContrastColor(news_area_color, theme, mode === 'dark');
	const formattedDate = news?.date ? format(parseISO(news.date), 'dd.MM.yyyy hh:mm') : 'Invalid Date';

	useEffect(() => {
		const handleResize = () => {
			setScreenWidth(Dimensions.get('window').width);
		};

		const subscription = Dimensions.addEventListener('change', handleResize);

		return () => subscription?.remove();
	}, []);

	const handleNewsDetails = async () => {
		const url = news?.url;
		if (Platform.OS === 'web') {
			window.open(url, '_blank');
		} else {
			const supported = await Linking.canOpenURL(url);

			if (supported) {
				await Linking.openURL(url);
			} else {
				toast(`Cannot open URL: ${url}`, 'error');
			}
		}
	};

	const {
		imageContainerWidth,
		newsContentWidth,
		cardFlexDirection,
		imageHeight,
		contentJustifyContent,
		contentPadding,
		headerMarginTop,
		headerFlexDirection,
		titleWidth,
		dateWidth,
		actionAlignItems,
		readMoreWidth,
	} = resolveNewsItemLayout(screenWidth);

	return (
		<View
			style={{
				...styles.card,
				flexDirection: cardFlexDirection,
				backgroundColor: theme.screen.iconBg,
			}}
		>
			<View
				style={{
					...styles.imageContainer,
					width: imageContainerWidth,
					height: imageHeight,
				}}
			>
				<Image
					source={{
						uri: news?.image_remote_url,
					}}
					style={styles.image}
				/>
			</View>
			<View
				style={{
					width: newsContentWidth,
					justifyContent: contentJustifyContent,
					padding: contentPadding,
				}}
			>
				<View
					style={{
						width: '100%',
					}}
				>
					<View
						style={{
							...styles.newsHeader,
							marginTop: headerMarginTop,
							marginBottom: 10,
							flexDirection: headerFlexDirection,
						}}
					>
						<Text
							style={{
								...styles.newsHeading,
								color: theme.screen.text,
								width: titleWidth,
							}}
						>
							{title}
						</Text>
						<Text
							style={{
								...styles.newsDate,
								color: theme.screen.text,
								width: dateWidth,
								textAlign: 'right',
							}}
						>
							{formattedDate}
						</Text>
					</View>
					<Text style={{ ...styles.newsBody, color: theme.screen.text }}>{content}</Text>
				</View>
				<View
					style={{
						...styles.actionContainer,
						alignItems: actionAlignItems,
					}}
				>
					<CustomTooltip
						placement="top"
						trigger={makeReadMoreTrigger({
							onPress: handleNewsDetails,
							backgroundColor: news_area_color,
							textColor: contrastColor,
							width: readMoreWidth,
							label: translate(TranslationKeys.read_more),
						})}
					>
						<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
							<TooltipText fontSize="$sm" color={theme.tooltip.text}>
								{translate(TranslationKeys.read_more)}
							</TooltipText>
						</TooltipContent>
					</CustomTooltip>
				</View>
			</View>
		</View>
	);
};

export default NewsItem;
