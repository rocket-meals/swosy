import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import IconButton from '@/components/UI/IconButton';
import { getImageUrl, numToOneDecimal } from '@/constants/HelperFunctions';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';
import { isWeb } from '@/constants/Constants';

interface FoodHeaderProps {
    foodDetails: any;
    screenWidth: number;
    openFullScreenImage: () => void;
    rateFood: (rating: number) => void;
    previousFeedback: any;
    appSettings: any;
    foodsAreaColor: string;
    theme: any;
    translate: (key: string) => string;
    defaultImage?: string | null;
}

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
}: FoodHeaderProps) => {
    const isLargeScreen = screenWidth > 1000;
    const isMediumScreen = screenWidth > 800;

    const renderRatingStars = () => (
        <View style={isWeb ? styles.stars : styles.mobileStars}>
            {Array.from({ length: 5 }).map((_, index) => (
                <React.Fragment key={index}>
                    {isWeb ? (
                        <Tooltip
                            placement="top"
                            trigger={(triggerProps) => (
                                <IconButton {...triggerProps} onPress={() => rateFood(index + 1)} style={{ padding: 5 }}>
                                    <MaterialIcons
                                        name={previousFeedback?.rating > index ? 'star' : 'star-border'}
                                        size={22}
                                        color={foodsAreaColor}
                                    />
                                </IconButton>
                            )}
                        >
                            <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                                <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                                    {`${translate(TranslationKeys.set_rating_to)} ${index + 1}`}
                                </TooltipText>
                            </TooltipContent>
                        </Tooltip>
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
            ))}
        </View>
    );

    if (isWeb) {
        return (
            <>
                <View
                    style={{
                        ...styles.featuredContainer,
                        width: isLargeScreen ? '80%' : '100%',
                        flexDirection: isLargeScreen ? 'row' : 'column',
                    }}
                >
                    <View
                        style={{
                            ...styles.foodDetail,
                            width: isLargeScreen ? '50%' : '100%',
                            alignItems: isLargeScreen ? 'flex-start' : 'center',
                        }}
                    >
                        <View
                            style={{
                                ...styles.imageContainer,
                                width: isLargeScreen ? 400 : screenWidth - 40,
                                height: isLargeScreen ? 400 : screenWidth - 40,
                            }}
                        >
                            <TouchableOpacity onPress={openFullScreenImage} activeOpacity={0.9} style={styles.featuredImage}>
                                <Image
                                    style={styles.featuredImage}
                                    source={
                                        foodDetails?.image_remote_url || foodDetails?.image
                                            ? {
                                                  uri: foodDetails?.image_remote_url || getImageUrl(foodDetails?.image),
                                              }
                                            : { uri: defaultImage || undefined }
                                    }
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View
                        style={{
                            ...styles.detailsContainer,
                            width: isLargeScreen ? '50%' : '100%',
                            justifyContent: isLargeScreen ? 'space-between' : 'flex-start',
                            height: isLargeScreen ? 400 : 'auto',
                            paddingHorizontal: isMediumScreen ? 20 : 0,
                        }}
                    >
                        <View style={{ width: '100%', alignItems: 'flex-end' }}>
                            {appSettings?.foods_ratings_average_display && (
                                <View
                                    style={{
                                        ...styles.ratingView,
                                        borderColor: theme.screen.text,
                                    }}
                                >
                                    <AntDesign name="star" size={22} color={foodsAreaColor} />
                                    <Text
                                        style={{
                                            ...styles.totalRating,
                                            color: theme.screen.text,
                                        }}
                                    >
                                        {(foodDetails?.rating_average || foodDetails?.rating_average_legacy) &&
                                            numToOneDecimal(
                                                foodDetails?.rating_average || foodDetails?.rating_average_legacy
                                            )}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View
                            style={{
                                ...styles.ratingContainer,
                                backgroundColor: theme.screen.iconBg,
                                marginTop: isLargeScreen ? 0 : 20,
                            }}
                        >
                            <Text style={{ ...styles.rateUs, color: theme.screen.text }}>
                                {translate(TranslationKeys.RATE_FOOD)}
                            </Text>
                            {renderRatingStars()}
                        </View>
                    </View>
                </View>
                <View
                    style={{
                        ...styles.featuredContainer,
                        width: isLargeScreen ? '80%' : '100%',
                    }}
                >
                    <Text
                        style={{
                            ...styles.foodHeading,
                            width: '100%',
                            color: theme.screen.text,
                            textAlign: isLargeScreen ? 'left' : 'center',
                            flexDirection: 'column',
                            fontSize: isMediumScreen ? 24 : 20,
                        }}
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
                <Image
                    source={
                        foodDetails?.image_remote_url || foodDetails?.image
                            ? {
                                  uri: foodDetails?.image_remote_url || getImageUrl(foodDetails?.image),
                              }
                            : { uri: defaultImage || undefined }
                    }
                    style={styles.mobileFeaturedImage}
                />
            </TouchableOpacity>
            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.mobileDetailsHeader}>
                    <View style={styles.row}>
                        <View />
                        {appSettings?.foods_ratings_average_display && (
                            <View
                                style={{
                                    ...styles.mobileRatingView,
                                    borderColor: theme.screen.text,
                                }}
                            >
                                <AntDesign name="star" size={18} color={foodsAreaColor} />
                                <Text
                                    style={{
                                        ...styles.mobileTotalRating,
                                        color: theme.screen.text,
                                    }}
                                >
                                    {(foodDetails?.rating_average || foodDetails?.rating_average_legacy) &&
                                        numToOneDecimal(
                                            foodDetails?.rating_average || foodDetails?.rating_average_legacy
                                        )}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.mobileDetailsFooter}></View>
            </View>
            <Text
                style={{
                    ...styles.mobileFoodHeading,
                    color: theme.screen.text,
                }}
            >
                {foodDetails?.name}
            </Text>
            <View
                style={{
                    ...styles.mobileRatingContainer,
                    backgroundColor: theme.screen.iconBg,
                }}
            >
                <Text
                    style={{
                        ...styles.mobileRateUs,
                        color: theme.screen.text,
                    }}
                >
                    {translate(TranslationKeys.RATE_FOOD)}
                </Text>
                {renderRatingStars()}
            </View>
        </View>
    );
};

export default memo(FoodHeader);
