import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { FormCategoriesHelper } from '@/redux/actions/Forms/FormCategories';
import { DatabaseTypes } from 'repo-depkit-common';
import { router, useFocusEffect } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { useDispatch } from 'react-redux';
import { getFromCategoryTranslation } from '@/helper/resourceHelper';
import { iconLibraries } from '@/components/Drawer/CustomDrawerContent';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { SET_CACHED_FORM_CATEGORIES } from '@/redux/Types/types';

const Index = () => {
	useSetPageTitle(TranslationKeys.select_a_form_category);
	const { theme } = useTheme();
	const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [isShowingCachedData, setIsShowingCachedData] = useState(false);
    const { language } = useAppSelector((state) => state.settings);
    const [formCategories, setFormCategories] = useState<DatabaseTypes.FormCategories[]>([]);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	const formCategoriesHelper = new FormCategoriesHelper();
	const { cachedFormCategories } = useAppSelector((state) => state.form);

	const getAllCategories = async () => {
		setLoading(true);
		setIsShowingCachedData(false);
		try {
			const result = (await formCategoriesHelper.fetchFormCategories({
				filter: { status: { _eq: 'published' } },
			})) as DatabaseTypes.FormCategories[];

			if (result) {
				setFormCategories(result);
				dispatch({ type: SET_CACHED_FORM_CATEGORIES, payload: result });
			}
		} catch {
			// Network failed – fall back to locally cached data
			const cached = cachedFormCategories || [];
			if (cached.length > 0) {
				setFormCategories(cached);
				setIsShowingCachedData(true);
			}
		} finally {
			setLoading(false);
		}
	};

	useFocusEffect(
		useCallback(() => {
			getAllCategories();
			return () => {};
		}, [])
	);

	useEffect(() => {
		const handleResize = () => setScreenWidth(Dimensions.get('window').width);
		const subscription = Dimensions.addEventListener('change', handleResize);
		return () => subscription?.remove();
	}, []);

	return (
		<ScrollView style={{ ...styles.container, backgroundColor: theme.screen.background }} contentContainerStyle={{ ...styles.contentContainer }}>
			<View
				style={{
					...styles.formCategories,
					width: screenWidth > 600 ? '80%' : '90%',
				}}
			>
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
					<>
						{formCategories &&
							formCategories?.map((category, index) => {
								let IconComponent: any = null;
								let iconName = '';
								if (category?.icon_expo) {
									const [library, name] = category?.icon_expo?.split(':') ?? [];
									if (iconLibraries[library]) {
										IconComponent = iconLibraries[library];
										iconName = name;
									}
								}
								return (
									<TouchableOpacity
										style={{
											...styles.formCategory,
											backgroundColor: theme.screen.iconBg,
										}}
										key={category?.id}
										onPress={() => {
											router.push({
												pathname: '/forms',
												params: { category_id: category?.id },
											});
										}}
									>
										<View style={styles.col}>
											{IconComponent && <IconComponent name={iconName} size={20} color={theme.screen.icon} />}
											<Text style={{ ...styles.body, color: theme.screen.text }}>{category?.translations ? getFromCategoryTranslation(category?.translations, language) : category?.alias}</Text>
										</View>
										<View style={styles.rowEnd}>
											{isShowingCachedData && (
												<MaterialCommunityIcons name="cached" size={18} color={theme.screen.icon} />
											)}
											<Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />
										</View>
									</TouchableOpacity>
								);
							})}
					</>
				)}
			</View>
		</ScrollView>
	);
};

export default Index;
