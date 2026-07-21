import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { CustomTooltip, TooltipContent, TooltipText } from '@/components/CustomTooltip';
import IconButton from '@/components/UI/IconButton';
import { numToOneDecimal } from '@/constants/HelperFunctions';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';
import { isWeb } from '@/constants/Constants';
import MyImage from '@/components/MyImage';
import SettingsList from '@/components/SettingsList';
import type { FoodDetailsSectionBaseProps } from './types';

interface FoodHeaderProps extends FoodDetailsSectionBaseProps {
    foodDetails: any;
    screenWidth: number;
    openFullScreenImage: () => void;
    rateFood: (rating: number) => void;
    appSettings: any;
    defaultImage?: string | null;
    initialImageAssetId?: string | number | null;
    initialImageRemoteUrl?: string | null;
}

const StarRatingIconButton = ({
    triggerProps,
    onPress,
    filled,
    color,
}: {
    triggerProps: object;
    onPress: () => void;
    filled: boolean;
    color: string;
}) => (
    <IconButton {...triggerProps} onPress={onPress} style={styles.paddingSmall}>
        <MaterialIcons name={filled ? 'star' : 'star-border'} size={22} color={color} />
    </IconButton>
);

// Factory returning a stable `trigger` render-prop for CustomTooltip, so no
// new function-that-returns-JSX is defined inside the parent component body.
function makeStarRatingTrigger(onPress: () => void, filled: boolean, color: string) {
    return (triggerProps: object) => (
        <StarRatingIconButton triggerProps={triggerProps} onPress={onPress} filled={filled} color={color} />
    );
}

// Resolves the average rating value to display, mirroring the previous inline
// `(a || b) && numToOneDecimal(a || b)` expression used in both the web and
// mobile render branches of FoodHeader.
function resolveDisplayRating(foodDetails: any) {
    const rating = foodDetails?.rating_average || foodDetails?.rating_average_legacy;
    return rating && numToOneDecimal(rating);
}

// Renders the "average rating" badge (star icon + numeric value) shown when
// `foods_ratings_average_display` is enabled. Extracted so the surrounding
// web/mobile render branches don't each carry this conditional inline.
const RatingAverageBadge = ({
    appSettings,
    foodDetails,
    theme,
    foodsAreaColor,
    viewStyle,
    textStyle,
    starSize,
}: {
    appSettings: any;
    foodDetails: any;
    theme: any;
    foodsAreaColor: string;
    viewStyle: any;
    textStyle: any;
    starSize: number;
}) => {
    if (!appSettings?.foods_ratings_average_display) {
        return null;
    }
    return (
        <View
            style={[
                viewStyle,
                { borderColor: theme.screen.text, backgroundColor: theme.screen.iconBg }
            ]}
        >
            <AntDesign name="star" size={starSize} color={foodsAreaColor} />
            <Text
                style={[
                    textStyle,
                    { color: theme.screen.text }
                ]}
            >
                {resolveDisplayRating(foodDetails)}
            </Text>
        </View>
    );
};

const FoodHeader = ({
    foodDetails,
    screenWidth,
    openFullScreenImage,
    rateFood,
    previousFeedback,
    appSettings,
    foodsAreaColor,
    theme,
    translate,
    defaultImage,
    isAccountRequired,
    onAccountRequired,
    containerWidth,
    initialImageAssetId,
    initialImageRemoteUrl,
}: FoodHeaderProps) => {
    const isLargeScreen = screenWidth > 1000;
    const isMediumScreen = screenWidth > 800;

    const dynamicImageStyle = useMemo(() => ({
        width: isLargeScreen ? 400 : screenWidth - 40,
        height: isLargeScreen ? 400 : screenWidth - 40,
    }), [isLargeScreen, screenWidth]);

    const imageRemoteUrl = useMemo(() => foodDetails?.image_remote_url || initialImageRemoteUrl, [foodDetails?.image_remote_url, initialImageRemoteUrl]);
    const imageAssetId = useMemo(() => foodDetails?.image || initialImageAssetId, [foodDetails?.image, initialImageAssetId]);

    const renderStarItem = useCallback((index: number) => (
        <React.Fragment key={index}>
            {isWeb ? (
                <CustomTooltip
                    placement="top"
                    trigger={makeStarRatingTrigger(() => rateFood(index + 1), previousFeedback?.rating > index, foodsAreaColor)}
                >
                    <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                        <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                            {`${translate(TranslationKeys.set_rating_to)} ${index + 1}`}
                        </TooltipText>
                    </TooltipContent>
                </CustomTooltip>
            ) : (
                <TouchableOpacity onPress={() => rateFood(index + 1)}>
                    <MaterialIcons
                        name={previousFeedback?.rating > index ? 'star' : 'star-border'}
                        size={20}
                        color={foodsAreaColor}
                    />
                </TouchableOpacity>
            )}
        </React.Fragment>
    ), [previousFeedback?.rating, foodsAreaColor, rateFood, theme, translate]);

    const renderRatingStars = useCallback(() => (
        <View style={isWeb ? styles.stars : styles.mobileStars}>
            {Array.from({ length: 5 }).map((_, index) => renderStarItem(index))}
        </View>
    ), [renderStarItem]);

    if (isWeb) {
        return (
            <>
                <View
                    style={[
                        styles.featuredContainer,
                        isLargeScreen ? styles.featuredContainerLarge : styles.featuredContainerSmall
                    ]}
                >
                    <View
                        style={[
                            styles.foodDetail,
                            isLargeScreen ? styles.foodDetailLarge : styles.foodDetailSmall
                        ]}
                    >
                        <View
                        style={[
                            styles.imageContainer,
                            dynamicImageStyle
                        ]}
                    >
                            <TouchableOpacity onPress={openFullScreenImage} activeOpacity={0.9} style={styles.featuredImage}>
                                <MyImage
                                    style={styles.featuredImage}
                                    remote_image_url={imageRemoteUrl}
                                    directus_asset_id={imageAssetId}
                                    defaultImageUrl={defaultImage}
                                    contentFit="cover"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View
                        style={[
                            styles.detailsContainer,
                            isLargeScreen ? styles.detailsContainerLarge : styles.detailsContainerSmall,
                            isMediumScreen ? styles.paddingHorizontalMedium : styles.paddingHorizontalNone
                        ]}
                    >
                        <View style={styles.fullWidthEnd}>
                            <RatingAverageBadge
                                appSettings={appSettings}
                                foodDetails={foodDetails}
                                theme={theme}
                                foodsAreaColor={foodsAreaColor}
                                viewStyle={styles.ratingView}
                                textStyle={styles.totalRating}
                                starSize={22}
                            />
                        </View>
                        <View style={isLargeScreen ? null : [styles.marginTopMedium, containerWidth ? { width: containerWidth } : null]}>
                            <SettingsList
                                leftIcon={<MaterialIcons name="star" size={22} />}
                                iconBgColor={foodsAreaColor}
                                title={translate(TranslationKeys.RATE_FOOD)}
                                rightElement={renderRatingStars()}
                                showSeparator={false}
                                groupPosition="single"
                                isAccountRequired={isAccountRequired}
                                onAccountRequired={onAccountRequired}
                            />
                        </View>
                    </View>
                </View>
                <View
                    style={[
                        styles.featuredContainer,
                        isLargeScreen ? styles.featuredContainerLarge : styles.featuredContainerSmall
                    ]}
                >
                    <Text
                        style={[
                            styles.foodHeading,
                            styles.widthFull,
                            { color: theme.screen.text },
                            isLargeScreen ? styles.textLeft : styles.textCenter,
                            styles.flexColumn,
                            isMediumScreen ? styles.fontSizeLarge : styles.fontSizeMedium
                        ]}
                    >
                        {foodDetails?.name}
                    </Text>
                </View>
            </>
        );
    }

    return (
        <View style={styles.mobileImageContainer}>
            <TouchableOpacity onPress={openFullScreenImage} activeOpacity={0.9} style={styles.mobileFeaturedImage}>
                <MyImage
                    style={styles.mobileFeaturedImage}
                    remote_image_url={imageRemoteUrl}
                    directus_asset_id={imageAssetId}
                    defaultImageUrl={defaultImage}
                    contentFit="cover"
                />
            </TouchableOpacity>
            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.mobileDetailsHeader}>
                    <View style={styles.row}>
                        <View />
                        <RatingAverageBadge
                            appSettings={appSettings}
                            foodDetails={foodDetails}
                            theme={theme}
                            foodsAreaColor={foodsAreaColor}
                            viewStyle={styles.mobileRatingView}
                            textStyle={styles.mobileTotalRating}
                            starSize={18}
                        />
                    </View>
                </View>
                <View style={styles.mobileDetailsFooter}></View>
            </View>
            <Text
                style={[
                    styles.mobileFoodHeading,
                    { color: theme.screen.text }
                ]}
            >
                {foodDetails?.name}
            </Text>
            <View style={styles.marginTopMedium}>
                {/* groupPosition="top" so the rating item visually groups with the notification item below (no gap, "bottom" position on mobile) */}
                <SettingsList
                    leftIcon={<MaterialIcons name="star" size={22} />}
                    iconBgColor={foodsAreaColor}
                    title={translate(TranslationKeys.RATE_FOOD)}
                    rightElement={renderRatingStars()}
                    showSeparator={false}
                    groupPosition="top"
                    isAccountRequired={isAccountRequired}
                    onAccountRequired={onAccountRequired}
                />
            </View>
        </View>
    );
};

export default memo(FoodHeader, (prevProps, nextProps) => {
    return (
        prevProps.foodDetails === nextProps.foodDetails &&
        prevProps.screenWidth === nextProps.screenWidth &&
        prevProps.previousFeedback === nextProps.previousFeedback &&
        prevProps.foodsAreaColor === nextProps.foodsAreaColor &&
        prevProps.theme === nextProps.theme &&
        prevProps.defaultImage === nextProps.defaultImage &&
        prevProps.isAccountRequired === nextProps.isAccountRequired &&
        prevProps.initialImageAssetId === nextProps.initialImageAssetId &&
        prevProps.initialImageRemoteUrl === nextProps.initialImageRemoteUrl
    );
});
