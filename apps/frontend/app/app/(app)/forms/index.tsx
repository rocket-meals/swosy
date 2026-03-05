import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { DatabaseTypes } from 'repo-depkit-common';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { useDispatch } from 'react-redux';
import { getFromCategoryTranslation } from '@/helper/resourceHelper';
import { iconLibraries } from '@/components/Drawer/CustomDrawerContent';
import { FormsHelper } from '@/redux/actions/Forms/Forms';
import { FormsSubmissionsHelper } from '@/redux/actions/Forms/FormSubmitions';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useLanguage } from '@/hooks/useLanguage';
import { SET_CACHED_FORM_DATA } from '@/redux/Types/types';

const CACHED_COLOR = '#22c55e';

const Index = () => {
	useSetPageTitle(TranslationKeys.select_a_form);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const [loading, setLoading] = useState(false);
	const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
	const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const { category_id } = useLocalSearchParams();
    const { language } = useAppSelector((state) => state.settings);
    const [forms, setForms] = useState<DatabaseTypes.Forms[]>([]);
	const formsHelper = new FormsHelper();
	const formsSubmissionsHelper = new FormsSubmissionsHelper();
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	const { cachedSubmissions } = useAppSelector((state) => state.form);

	const getAllForms = async () => {
		setLoading(true);
		const result = (await formsHelper.fetchForms({
			filter: { category: { _eq: category_id }, status: { _eq: 'published' } },
		})) as DatabaseTypes.Forms[];
		if (result) {
			setLoading(false);
			setForms(result);
		}
	};

	const downloadFormDrafts = async (formId: string) => {
		setDownloadingIds(prev => new Set(prev).add(formId));
		try {
			const result = (await formsSubmissionsHelper.fetchFormSubmissions({
				form: formId,
				state: 'draft',
				limit: -1,
			})) as DatabaseTypes.FormSubmissions[];
			dispatch({
				type: SET_CACHED_FORM_DATA,
				payload: { form_id: formId, submissions: result || [] },
			});
		} catch {
			// keep any previously cached data unchanged
		} finally {
			setDownloadingIds(prev => {
				const next = new Set(prev);
				next.delete(formId);
				return next;
			});
		}
	};

	const downloadAllDrafts = async () => {
		if (!forms || forms.length === 0 || isDownloadingAll) return;
		setIsDownloadingAll(true);
		await Promise.allSettled(forms.map(form => downloadFormDrafts(String(form.id))));
		setIsDownloadingAll(false);
	};

	useFocusEffect(
		useCallback(() => {
			if (category_id) {
				getAllForms();
			}
			return () => {};
		}, [category_id])
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
				<TouchableOpacity
					onPress={downloadAllDrafts}
					disabled={isDownloadingAll || loading}
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						alignSelf: 'flex-end',
						gap: 6,
						paddingVertical: 8,
						paddingHorizontal: 14,
						borderRadius: 20,
						backgroundColor: theme.screen.iconBg,
						marginBottom: 6,
					}}
				>
					{isDownloadingAll ? (
						<ActivityIndicator size={18} color={theme.screen.icon} />
					) : (
						<MaterialCommunityIcons name="download" size={20} color={theme.screen.icon} />
					)}
					<Text style={{ color: theme.screen.text, fontFamily: 'Poppins_400Regular', fontSize: 14 }}>
						{isDownloadingAll ? translate(TranslationKeys.form_cache_downloading) : translate(TranslationKeys.form_cache_download)}
					</Text>
				</TouchableOpacity>
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
						{forms &&
							forms?.map((form, index) => {
								let IconComponent: any = null;
								let iconName = '';
								if (form?.icon_expo) {
									const [library, name] = form?.icon_expo?.split(':') ?? [];
									if (iconLibraries[library]) {
										IconComponent = iconLibraries[library];
										iconName = name;
									}
								}
								const formId = String(form?.id);
								const isCached = !!(cachedSubmissions && cachedSubmissions[formId]);
								const isThisDownloading = downloadingIds.has(formId);
								return (
									<TouchableOpacity
										style={{
											...styles.formCategory,
											backgroundColor: theme.screen.iconBg,
										}}
										key={form?.id}
										onPress={() => {
											router.push({
												pathname: '/form-submissions',
												params: { form_id: form?.id },
											});
										}}
									>
										<View style={styles.col}>
											{IconComponent && <IconComponent name={iconName} size={20} color={theme.screen.icon} />}
											<Text style={{ ...styles.body, color: theme.screen.text }}>{form?.translations ? getFromCategoryTranslation(form?.translations, language) : form?.alias}</Text>
										</View>
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
											{isThisDownloading ? (
												<ActivityIndicator size={16} color={CACHED_COLOR} />
											) : isCached ? (
												<MaterialCommunityIcons name="check-circle" size={18} color={CACHED_COLOR} />
											) : null}
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
