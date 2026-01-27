import { ActivityIndicator, Dimensions, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import FeedbackLabel from '../FeedbackLabel';
import { isWeb } from '@/constants/Constants';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { getpreviousFeedback, numToOneDecimal } from '@/constants/HelperFunctions';
import { DatabaseTypes, DateHelper } from 'repo-depkit-common';
import { FoodFeedbackHelper } from '@/redux/actions/FoodFeedbacks/FoodFeedbacks';
import useToast from '@/hooks/useToast';
import { DELETE_FOOD_FEEDBACK_LOCAL, UPDATE_FOOD_FEEDBACK_LOCAL } from '@/redux/Types/types';
import { createSelector } from 'reselect';
import { useLanguage } from '@/hooks/useLanguage';
import { myContrastColor } from '@/helper/ColorHelper';
import SettingsList from '@/components/SettingsList';
import { TranslationKeys } from '@/locales/keys';
import { FeedbacksProps } from './types';
import { RootState } from '@/redux/reducer';
import useRatingPermissionModal from '@/hooks/useRatingPermissionModal';

const loadingState = {
	submitLoading: false,
	deleteLoading: false,
};

const selectFeedbackData = createSelector([(state: RootState) => state.food, (_state: RootState, foodId: string) => foodId], (food, foodId) => ({
	labels: food.foodFeedbackLabels,
	labelEntries: food.ownfoodFeedbackLabelEntries,
	previousFeedback: getpreviousFeedback(food.ownFoodFeedbacks, foodId),
}));

const Feedbacks: React.FC<FeedbacksProps> = ({ foodDetails, offerId, canteenId }) => {
	const toast = useToast();
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const foodOfferCanteenId = canteenId;
	const { user, profile } = useAppSelector((state) => state.authReducer);
	const { appSettings, primaryColor, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const [commentType, setCommentType] = useState('');
	const [loading, setLoading] = useState(loadingState);
	const [comment, setComment] = useState('');
	const { openRatingPermissionModal } = useRatingPermissionModal();
	const foodFeedbackHelper = useMemo(() => new FoodFeedbackHelper(), []);
	const { labels, labelEntries, previousFeedback } = useAppSelector((state) => selectFeedbackData(state, foodDetails?.id));
	const foods_area_color = appSettings?.foods_area_color ? appSettings?.foods_area_color : primaryColor;
	const contrastColor = myContrastColor(foods_area_color, theme, mode === 'dark');
	useEffect(() => {
		if (appSettings?.foods_feedbacks_comments_type) {
			setCommentType(appSettings?.foods_feedbacks_comments_type);
		}
	}, [appSettings]);

	const submitCommentFeedback = async (string: string | null) => {
		if (!user?.id) {
			openRatingPermissionModal();
			return;
		}

		if (string !== null && !string.trim()) {
			toast('Please write a comment', 'error');
			return;
		}

		// Set loading state based on whether string is null or not
		setLoading(prev => ({
			...prev,
			[string === null ? 'deleteLoading' : 'submitLoading']: true,
		}));

		try {
			const result = (await foodFeedbackHelper.updateFoodFeedback(foodDetails?.id, profile?.id, { ...previousFeedback, comment: string, canteen: foodOfferCanteenId })) as DatabaseTypes.FoodsFeedbacks;
			// Dispatch the correct action
			dispatch({
				type: result?.id ? UPDATE_FOOD_FEEDBACK_LOCAL : DELETE_FOOD_FEEDBACK_LOCAL,
				payload: result?.id ? result : previousFeedback.id,
			});

			// Clear comment and reset loading state
			setComment('');
			setLoading(loadingState);
		} catch (error) {
			console.error('Error submitting comment feedback:', error);
			setLoading(loadingState);
		}
	};

	useEffect(() => {
		if (previousFeedback.comment) {
			setComment(previousFeedback.comment);
		}
	}, [previousFeedback]);

	const handleTextChange = (text: string) => {
		if (!user?.id) {
			openRatingPermissionModal();
			return;
		}

		if (text.length > 120) {
			toast('Comment should be less than 500 characters', 'error');
			return;
		}
		setComment(text);
	};

	const resp = Dimensions.get('window').width > 800;
	const rating = foodDetails?.rating_average ?? foodDetails?.rating_average_legacy;
	const ratingAmount = foodDetails?.rating_amount ?? foodDetails?.rating_amount_legacy;
	const showRatingsAmount = appSettings?.foods_ratings_amount_display;
	const showRatingsAverage = appSettings?.foods_ratings_average_display;
	const ratingSummaryItems = [];
	if (showRatingsAmount) {
		ratingSummaryItems.push({
			key: 'ratings-amount',
			icon: <Ionicons name="bar-chart" size={20} />,
			leftText: translate(TranslationKeys.amount_ratings),
			rightText: ratingAmount !== null && ratingAmount !== undefined ? `${ratingAmount}` : '-',
		});
	}
	if (showRatingsAverage) {
		ratingSummaryItems.push({
			key: 'ratings-average',
			icon: <AntDesign name="star" size={20} />,
			leftText: translate(TranslationKeys.average_rating),
			rightText: typeof rating === 'number' && !isNaN(rating) ? `${numToOneDecimal(rating)}` : '-',
		});
	}

	const otherComments = foodDetails?.feedbacks?.filter(feedback => feedback.profile !== profile.id && feedback.comment).sort((a, b) => new Date(b.date_updated).getTime() - new Date(a.date_updated).getTime());
	return (
		<View style={styles.container}>
			{showRatingsAmount ||
				(showRatingsAverage && (
					<Text
						style={[
							styles.heading,
							isWeb ? styles.headingWeb : styles.headingMobile,
							{ color: theme.screen.text }
						]}
					>
						{translate(TranslationKeys.food_feedbacks)}
					</Text>
				))}
			{ratingSummaryItems.length > 0 && (
				<View style={styles.ratingSummaryContainer}>
					{ratingSummaryItems.map((item, index) => {
						const groupPosition =
							ratingSummaryItems.length === 1 ? 'single' : index === 0 ? 'top' : index === ratingSummaryItems.length - 1 ? 'bottom' : 'middle';
						return (
							<SettingsList
								key={item.key}
								iconBgColor={foods_area_color}
								leftIcon={item.icon}
								label={item.leftText}
								value={item.rightText}
								groupPosition={groupPosition}
							/>
						);
					})}
				</View>
			)}

			<Text
				style={[
					styles.heading,
					isWeb ? styles.headingWeb : styles.headingMobile,
					{ color: theme.screen.text }
				]}
			>
				{translate(TranslationKeys.feedback_labels)}
			</Text>
			{labels.map((label: any) => (
				<FeedbackLabel key={label.id} label={label.translations} icon={label.icon ? label.icon : undefined} imageUrl={label.image ? label.image : undefined} labelEntries={labelEntries} foodId={foodDetails?.id} offerId={offerId} />
			))}
			{commentType !== 'disabled' && commentType !== 'read' && (
				<View
					style={[
						styles.searchContainer,
						resp ? styles.searchContainerRow : styles.searchContainerColumn,
						{ backgroundColor: theme.screen.iconBg }
					]}
				>
					<TextInput style={[styles.input, resp ? styles.inputWide : styles.inputFull, Platform.OS === 'web' && styles.inputWeb]} cursorColor={theme.modal.text} placeholderTextColor={theme.modal.placeholder} onChangeText={handleTextChange} value={comment} placeholder={translate(TranslationKeys.your_comment)} editable={commentType === 'disabled' || commentType === 'read' ? false : true} />
					<TouchableOpacity
						style={[
							styles.commentButton,
							styles.commentButtonBase,
							{
								width: resp ? 220 : '90%',
								backgroundColor: foods_area_color,
							}
						]}
						onPress={() => {
							submitCommentFeedback(comment);
						}}
						disabled={previousFeedback?.comment === comment}
					>
						{loading.submitLoading ? <ActivityIndicator color={theme.background} size={22} /> : <Text style={[styles.commentLabel, { color: contrastColor }]}>{translate(TranslationKeys.save_comment)}</Text>}
					</TouchableOpacity>
				</View>
			)}
			{commentType !== 'disabled' && (
				<>
					{previousFeedback && previousFeedback.comment && (
						<View style={styles.commentsContainer}>
							<View style={styles.commentsHeader}>
								<Text
									style={[
										styles.heading,
										styles.subHeading,
										{ color: theme.screen.text }
									]}
								>
									{translate(TranslationKeys.your_comment)}
								</Text>
								<TouchableOpacity
									style={[
										styles.deleteButton,
										{ backgroundColor: theme.screen.iconBg }
									]}
									onPress={() => submitCommentFeedback(null)}
								>
									{loading.deleteLoading ? <ActivityIndicator color={foods_area_color} size={20} /> : <MaterialIcons name="delete-outline" size={24} color={'red'} />}
								</TouchableOpacity>
							</View>
							<View style={styles.comment}>
								<Text style={[styles.commentText, { color: theme.screen.text }]}>{previousFeedback.comment}</Text>
								<Text style={[styles.commentDate, { color: theme.screen.text }]}>{DateHelper.formatOfferDateToReadable(previousFeedback.updated_at, true, true)}</Text>
								<View style={styles.divider} />
							</View>
						</View>
					)}
					{commentType !== 'write' && (
						<>
							{otherComments?.length > 0 && (
								<View style={styles.commentsContainer}>
									<Text
										style={[
											styles.heading,
											styles.subHeading,
											{ color: theme.screen.text }
										]}
									>
										{translate(TranslationKeys.others_comments)}
									</Text>
									{otherComments.map(feedback => (
										<View key={feedback.id} style={styles.comment}>
											<Text
												style={[
													styles.commentText,
													{ color: theme.screen.text }
												]}
											>
												{feedback.comment}
											</Text>
											<Text
												style={[
													styles.commentDate,
													{ color: theme.screen.text }
												]}
											>
												{DateHelper.formatOfferDateToReadable(feedback.date_updated, true, true)}
											</Text>
											<View style={styles.divider} />
										</View>
									))}
								</View>
							)}
						</>
					)}
				</>
			)}

		</View>
	);
};

export default Feedbacks;
