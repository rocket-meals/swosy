import { ActivityIndicator, Dimensions, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { Entypo, FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { DatabaseTypes, FormHelperCommon } from 'repo-depkit-common';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { isWeb } from '@/constants/Constants';
import { FormsSubmissionsHelper } from '@/redux/actions/Forms/FormSubmitions';
import { FormAnswersHelper } from '@/redux/actions/Forms/FormAnswers';
import BaseBottomSheet from '@/components/BaseBottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import FilterFormSheet from '@/components/FilterFormSheet/FilterFormSheet';
import { excerpt } from '@/constants/HelperFunctions';
import { filterOptions } from './constants';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import FormSubmissionSortSheet from '@/components/FormSubmissionSortSheet/FormSubmissionSortSheet';
import { FormSubmissionSortOption } from '@/components/FormSubmissionSortSheet/types';
import { useAppSelector } from '@/redux/hooks';
import { useDispatch } from 'react-redux';
import { REMOVE_FORM_QUEUE_ENTRY } from '@/redux/Types/types';
import { FormQueueEntry } from '@/redux/Types/stateTypes';
import useToast from '@/hooks/useToast';
import { format, isValid, parse } from 'date-fns';
import { uploadToDirectus, uploadToDirectusFromMobile } from '@/constants/HelperFunctions';
import { Buffer } from 'buffer';

type FormSubmissionListRow =
	| {
			type: 'folder';
			id: string;
			title: string;
			path: string[];
	  }
	| {
			type: 'submission';
			id: string;
			title: string;
			submission: DatabaseTypes.FormSubmissions;
	  };

const Index = () => {
	useSetPageTitle(TranslationKeys.select_a_form_submission);
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const toast = useToast();
	const { form_id } = useLocalSearchParams();
	const sortSheetRef = useRef<BottomSheet>(null);
	const [loading, setLoading] = useState(false);
	const [syncingId, setSyncingId] = useState<string | null>(null);
	const [query, setQuery] = useState<string>('');
	const [isActive, setIsActive] = useState(false);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	const formsSubmissionsHelper = new FormsSubmissionsHelper();
	const formAnswersHelper = new FormAnswersHelper();
	const [formSubmissions, setFormSubmissions] = useState<DatabaseTypes.FormSubmissions[]>([]);
    const [selectedOption, setSelectedOption] = useState<string>('draft');
    const [sortOption, setSortOption] = useState<FormSubmissionSortOption>('alphabetical');
    const { drawerPosition, language, primaryColor } = useAppSelector((state) => state.settings);
    const [currentPath, setCurrentPath] = useState<string[]>([]);
	const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
	const [showQueue, setShowQueue] = useState(false);
	const { formQueue } = useAppSelector((state) => state.form);

	const queueEntries = useMemo(
		() => (formQueue || []).filter((entry: FormQueueEntry) => entry.form_id === String(form_id)),
		[formQueue, form_id]
	);

	const folderPrefixes = useMemo(() => {
		const prefixes = new Set<string>();

		if (!formSubmissions || formSubmissions.length === 0) {
			return prefixes;
		}

		formSubmissions.forEach(submission => {
			const alias = submission.alias || '';
			const segments = alias
				.split('/')
				.map(segment => segment.trim())
				.filter(Boolean);

			for (let index = 0; index < segments.length - 1; index += 1) {
				const prefix = segments.slice(0, index + 1).join('/');
				prefixes.add(prefix);
			}
		});

		return prefixes;
	}, [formSubmissions]);

	const listData = useMemo<FormSubmissionListRow[]>(() => {
		if (!formSubmissions || formSubmissions.length === 0) {
			return [];
		}

		const rows: FormSubmissionListRow[] = [];
		const seenFolders = new Set<string>();
		const fallbackTitle = translate(TranslationKeys.no_value);

		formSubmissions.forEach(submission => {
			const alias = submission.alias || '';
			const segments = alias
				.split('/')
				.map(segment => segment.trim())
				.filter(Boolean);

			if (currentPath.length === 0) {
				if (segments.length === 0) {
					rows.push({
						type: 'submission',
						id: submission.id.toString(),
						title: alias || fallbackTitle,
						submission,
					});

					return;
				}

				const folderPath = segments[0];
				const folderKey = folderPath;

				if (segments.length > 1 || folderPrefixes.has(folderKey)) {
					if (!seenFolders.has(folderKey)) {
						seenFolders.add(folderKey);
						rows.push({
							type: 'folder',
							id: `folder-${encodeURIComponent(folderKey)}`,
							title: folderPath,
							path: [folderPath],
						});
					}
				} else {
					rows.push({
						type: 'submission',
						id: submission.id.toString(),
						title: segments[0] || alias || fallbackTitle,
						submission,
					});
				}

				return;
			}

			if (segments.length < currentPath.length) {
				return;
			}

			const matchesPath = currentPath.every((segment, index) => segments[index] === segment);

			if (!matchesPath) {
				return;
			}

			if (segments.length === currentPath.length) {
				rows.push({
					type: 'submission',
					id: submission.id.toString(),
					title: segments[segments.length - 1] || alias || fallbackTitle,
					submission,
				});
				return;
			}

			const remainder = segments.slice(currentPath.length);
			const nextFolder = remainder[0];
			const folderPath = [...currentPath, nextFolder];
			const folderKey = folderPath.join('/');

			if (remainder.length === 1 && !folderPrefixes.has(folderKey)) {
				rows.push({
					type: 'submission',
					id: submission.id.toString(),
					title: remainder[0] || alias || fallbackTitle,
					submission,
				});
				return;
			}

			if (!seenFolders.has(folderKey)) {
				seenFolders.add(folderKey);
				rows.push({
					type: 'folder',
					id: `folder-${encodeURIComponent(folderKey)}`,
					title: nextFolder,
					path: folderPath,
				});
			}
		});

		return rows;
	}, [formSubmissions, currentPath, folderPrefixes, translate]);

	const openFilterSheet = () => {
		setIsFilterModalVisible(true);
	};

	const closeFilterSheet = () => {
		setIsFilterModalVisible(false);
	};

	const openSortSheet = () => {
		sortSheetRef.current?.expand();
	};

	const closeSortSheet = () => {
		sortSheetRef.current?.close();
	};

	const sortFormSubmissions = useCallback(
		(submissions: DatabaseTypes.FormSubmissions[], option: FormSubmissionSortOption) => {
			if (!submissions || submissions.length === 0) {
				return submissions;
			}

			const normalizedLocale = language || undefined;
			const sortedSubmissions = [...submissions];

			switch (option) {
				case 'alphabetical':
				default:
					sortedSubmissions.sort((first, second) => {
						const firstAlias = (first.alias || '').trim();
						const secondAlias = (second.alias || '').trim();

						if (!firstAlias && !secondAlias) {
							return 0;
						}

						if (!firstAlias) {
							return 1;
						}

						if (!secondAlias) {
							return -1;
						}

						return firstAlias.localeCompare(secondAlias, normalizedLocale, {
							sensitivity: 'base',
						});
					});
					break;
			}

			return sortedSubmissions;
		},
		[language]
	);

	const loadFormSubmissions = async (pageNumber: number, append: boolean = false) => {
		if (!form_id) return;
		setLoading(true);

		try {
			const result = (await formsSubmissionsHelper.fetchFormSubmissions({
				state: selectedOption || 'draft',
				form: form_id,
				alias: query ? query?.trim() : '',
			})) as DatabaseTypes.FormSubmissions[];

			if (result) {
				const sortedResult = sortFormSubmissions(result, sortOption);
				if (append) {
					setFormSubmissions(prev => {
						const merged = [...(prev || []), ...sortedResult];
						return sortFormSubmissions(merged, sortOption);
					});
				} else {
					setFormSubmissions(sortedResult);
				}
			}
		} catch (error) {
			console.error('Error fetching form submissions', error);
		} finally {
			setLoading(false);
		}
	};

	useFocusEffect(
		useCallback(() => {
			if (form_id) {
				loadFormSubmissions(1, false);
			}
			return () => {};
		}, [form_id, selectedOption, sortOption])
	);

	useEffect(() => {
		setFormSubmissions(prev => sortFormSubmissions(prev, sortOption));
	}, [sortFormSubmissions, sortOption]);

	const handleSearchFilter = () => {
		loadFormSubmissions(1, false);
	};

	const syncQueueEntry = async (entry: FormQueueEntry) => {
		setSyncingId(entry.id);
		try {
			const answers = (await formAnswersHelper.fetchFormAnswers({
				filter: { form_submission: { _eq: entry.form_submission_id } },
			})) as DatabaseTypes.FormAnswers[];

			if (!answers || answers.length === 0) {
				toast(translate(TranslationKeys.form_queue_sync_failed), 'error');
				setSyncingId(null);
				return;
			}

			const filteredAnswers = answers.filter((answer: DatabaseTypes.FormAnswers) => entry.formData.hasOwnProperty(String(answer?.id)));

			const updatedAnswers = await Promise.all(
				filteredAnswers.map(async (answer: DatabaseTypes.FormAnswers) => {
					const fieldId = String(answer?.id);
					const formDataEntry = entry.formData[fieldId];
					if (!formDataEntry) return null;
					const { value, custom_type } = formDataEntry;
					const fieldType = (answer?.form_field as DatabaseTypes.FormFields)?.field_type || '';

					let updatedValueFields: Record<string, any> = {};
					if (custom_type === 'value_string') {
						updatedValueFields = { value_string: value };
					} else if (custom_type === 'value_number') {
						updatedValueFields = { value_number: value ? String(value).replace(',', '.') : null };
					} else if (custom_type === 'value_boolean') {
						updatedValueFields = { value_boolean: value === 0 ? false : value === 1 ? true : null };
					} else if (custom_type === 'value_custom') {
						updatedValueFields = { value_custom: value };
					} else if (custom_type === 'value_date') {
						let formattedDate: string | null = null;
						try {
							if (value) {
								let dateObj;
								if (fieldType === FormHelperCommon.FORM_FIELD_TYPE.DATE_DATE_AND_HH_MM) {
									dateObj = parse(value, 'dd.MM.yyyy HH:mm', new Date());
								} else if (fieldType === FormHelperCommon.FORM_FIELD_TYPE.DATE) {
									dateObj = parse(value, 'dd.MM.yyyy', new Date());
								} else if (fieldType === FormHelperCommon.FORM_FIELD_TYPE.DATE_HH_MM) {
									const today = format(new Date(), 'yyyy-MM-dd');
									dateObj = parse(`${today} ${value}`, 'yyyy-MM-dd HH:mm', new Date());
								} else if (fieldType === FormHelperCommon.FORM_FIELD_TYPE.DATE_TIMESTAMP) {
									dateObj = parse(value, 'dd.MM.yyyy HH:mm:ss', new Date());
								}
								if (dateObj && isValid(dateObj)) {
									formattedDate = format(dateObj, "yyyy-MM-dd'T'HH:mm:ss.SSSX");
								}
							}
						} catch {
							formattedDate = null;
						}
						updatedValueFields = { value_date: formattedDate };
					} else if (custom_type === 'value_image') {
						if (value?.name) {
							try {
								const response = await fetch(value.image);
								const arrayBuffer = await response.arrayBuffer();
								const buffer = Buffer.from(arrayBuffer);
								const fileData = { name: value.name, type: value.type, buffer: isWeb ? buffer : value.image, edit: true };
								const fileId = isWeb ? await uploadToDirectus(fileData) : await uploadToDirectusFromMobile(fileData);
								updatedValueFields = { value_image: fileId };
							} catch {
								updatedValueFields = {};
							}
						}
					} else if (custom_type === 'value_files' && Array.isArray(value)) {
						try {
							const uploadedIds = await Promise.all(
								value.filter((file: any) => !file?.edit).map(async (file: any) => {
									const response = await fetch(file.image);
									const arrayBuffer = await response.arrayBuffer();
									const buffer = Buffer.from(arrayBuffer);
									const fileData = { name: file.name, type: file.type, buffer: isWeb ? buffer : file.image, edit: true };
									return isWeb ? uploadToDirectus(fileData) : uploadToDirectusFromMobile(fileData);
								})
							);
							updatedValueFields = {
								value_files: {
									create: uploadedIds.filter(Boolean).map((fileId: any) => ({ directus_files_id: fileId })),
								},
							};
						} catch {
							updatedValueFields = {};
						}
					}

					return { id: fieldId, ...updatedValueFields };
				})
			);

			const finalAnswers = updatedAnswers.filter(Boolean);
			await Promise.all(finalAnswers.map((answer: any) => formAnswersHelper.updateFormAnswers(answer.id, answer)));
			await formsSubmissionsHelper.updateFormSubmissionById(entry.form_submission_id, { state: entry.targetState });
			dispatch({ type: REMOVE_FORM_QUEUE_ENTRY, payload: entry.id });
			toast(translate(TranslationKeys.form_queue_synced), 'success');
		} catch (error) {
			console.error('Queue sync error:', error);
			toast(translate(TranslationKeys.form_queue_sync_failed), 'error');
		} finally {
			setSyncingId(null);
		}
	};

	const syncAllQueueEntries = async () => {
		await Promise.allSettled(queueEntries.map((entry: FormQueueEntry) => syncQueueEntry(entry)));
	};

	useFocusEffect(
		useCallback(() => {
			setIsActive(true);
			return () => {
				setIsActive(false);
			};
		}, [])
	);

	useEffect(() => {
		const handleResize = () => {
			setScreenWidth(Dimensions.get('window').width);
		};

		const subscription = Dimensions.addEventListener('change', handleResize);

		return () => subscription?.remove();
	}, []);

	useEffect(() => {
		if (currentPath.length === 0) {
			return;
		}

		const pathExists = formSubmissions.some(submission => {
			const alias = submission.alias || '';
			const segments = alias
				.split('/')
				.map(segment => segment.trim())
				.filter(Boolean);

			if (segments.length < currentPath.length) {
				return false;
			}

			return currentPath.every((segment, index) => segments[index] === segment);
		});

		if (!pathExists) {
			setCurrentPath([]);
		}
	}, [currentPath, formSubmissions]);

	const renderItem = useCallback(
		({ item }: { item: FormSubmissionListRow }) => {
			const baseStyle = {
				...styles.formCategory,
				backgroundColor: theme.screen.iconBg,
				paddingLeft: 10 + currentPath.length * 8,
			};

			if (item.type === 'folder') {
				return (
					<TouchableOpacity
						style={baseStyle}
						onPress={() => {
							setCurrentPath(item.path);
						}}
					>
						<Text style={{ ...styles.body, color: theme.screen.text }}>{item.title}</Text>
						<Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />
					</TouchableOpacity>
				);
			}

			return (
				<TouchableOpacity
					style={baseStyle}
					onPress={() => {
						router.push({
							pathname: '/form-submission',
							params: { form_submission_id: item?.submission?.id },
						});
					}}
				>
					<Text style={{ ...styles.body, color: theme.screen.text }}>{item.title || item.submission?.alias}</Text>
					<Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />
				</TouchableOpacity>
			);
		},
		[currentPath.length, router, theme.screen.icon, theme.screen.iconBg, theme.screen.text]
	);

	return (
		<View
			style={{
				...styles.container,
				backgroundColor: theme.screen.background,
			}}
		>
			<View
				style={{
					...styles.header,
					backgroundColor: theme.header.background,
					paddingHorizontal: isWeb ? 20 : 10,
					gap: screenWidth > 768 ? 20 : 10,
				}}
			>
				<View
					style={[
						styles.row,
						{
							flexDirection: drawerPosition === 'right' ? 'row-reverse' : 'row',
						},
					]}
				>
					<View
						style={[
							styles.col1,
							screenWidth > 768
								? {
										gap: 20,
									}
								: {
										gap: 10,
									},
							{
								flexDirection: drawerPosition === 'right' ? 'row-reverse' : 'row',
							},
						]}
					>
						<TouchableOpacity
							onPress={() => {
								if (currentPath.length > 0) {
									setCurrentPath(prev => prev.slice(0, -1));
								} else {
									router.navigate('/form-categories');
								}
							}}
							style={{ padding: 10 }}
						>
							<Ionicons name="arrow-back" size={26} color={theme.header.text} />
						</TouchableOpacity>
						<Text style={{ ...styles.heading, color: theme.header.text }}>{excerpt(translate(TranslationKeys.select_a_form_submission), screenWidth > 900 ? 100 : screenWidth > 700 ? 80 : 22)}</Text>
					</View>
					<View style={{ ...styles.col2, gap: isWeb ? 30 : 15 }}>
						<TouchableOpacity onPress={openSortSheet} style={{ padding: 10 }}>
							<FontAwesome5 name="sort-alpha-down" size={22} color={theme.header.text} />
						</TouchableOpacity>
						<TouchableOpacity onPress={openFilterSheet} style={{ padding: 10 }}>
							<FontAwesome name="filter" size={24} color={theme.header.text} />
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => setShowQueue(prev => !prev)}
							style={{ padding: 10 }}
						>
							<View>
								<MaterialCommunityIcons
									name="clock-outline"
									size={24}
									color={showQueue ? primaryColor : theme.header.text}
								/>
								{queueEntries.length > 0 && (
									<View
										style={{
											position: 'absolute',
											top: -4,
											right: -4,
											backgroundColor: 'red',
											borderRadius: 8,
											minWidth: 16,
											height: 16,
											justifyContent: 'center',
											alignItems: 'center',
											paddingHorizontal: 2,
										}}
									>
										<Text style={{ color: 'white', fontSize: 10, fontFamily: 'Poppins_700Bold' }}>{queueEntries.length}</Text>
									</View>
								)}
							</View>
						</TouchableOpacity>
					</View>
				</View>
			</View>
			<View style={styles.contentContainer}>
			{showQueue ? (
				<View style={{ width: '100%', alignItems: 'center', paddingVertical: 20 }}>
					<Text
						style={{
							...styles.selectedState,
							color: theme.screen.text,
							fontSize: screenWidth > 600 ? 30 : 20,
							marginBottom: screenWidth > 600 ? 0 : 10,
						}}
					>
						{translate(TranslationKeys.form_queue)}
					</Text>
					{queueEntries.length > 0 && (
						<TouchableOpacity
							onPress={syncAllQueueEntries}
							style={{
								marginTop: 10,
								paddingHorizontal: 20,
								paddingVertical: 10,
								borderRadius: 20,
								backgroundColor: theme.screen.iconBg,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 8,
							}}
						>
							<MaterialCommunityIcons name="sync" size={20} color={theme.screen.icon} />
							<Text style={{ color: theme.screen.text, fontFamily: 'Poppins_400Regular' }}>{translate(TranslationKeys.form_queue_sync_all)}</Text>
						</TouchableOpacity>
					)}
				</View>
			) : (
				<>
					<View style={styles.stateContainer}>
						<Text
							style={{
								...styles.selectedState,
								color: theme.screen.text,
								fontSize: screenWidth > 600 ? 30 : 20,
								marginBottom: screenWidth > 600 ? 0 : 10,
							}}
						>
							{`${translate(TranslationKeys.state)}: ${translate(selectedOption)}`}
						</Text>
					</View>
					<View
						style={{
							...styles.searchContainer,
							width: screenWidth > 768 ? '60%' : '90%',
							marginTop: screenWidth > 768 ? 20 : 0,
							marginBottom: screenWidth > 768 ? 20 : 0,
						}}
					>
						<TextInput
							style={{
								...styles.searchInput,
								width: screenWidth > 768 ? '90%' : '85%',
								color: theme.screen.text,
							}}
							cursorColor={theme.screen.text}
							placeholderTextColor={theme.screen.placeholder}
							onChangeText={setQuery}
							value={query}
							placeholder={translate(TranslationKeys.search_with_alias)}
						/>
						<TouchableOpacity
							style={{
								...styles.searchButton,
								backgroundColor: theme.screen.iconBg,
								width: screenWidth > 768 ? '10%' : '15%',
							}}
							onPress={handleSearchFilter}
						>
							<Ionicons name="search" color={theme.screen.icon} size={22} />
						</TouchableOpacity>
					</View>
				</>
			)}
		</View>
		<View
			style={{
				flex: 1,
				width: '100%',
				marginTop: 10,
				alignItems: 'center',
			}}
		>
			<View style={{ flex: 1, width: screenWidth > 768 ? '70%' : '90%' }}>
				{showQueue ? (
					queueEntries.length === 0 ? (
						<View style={{ padding: 20, alignItems: 'center' }}>
							<Text style={{ color: theme.screen.text, fontSize: 16 }}>{translate(TranslationKeys.form_queue_empty)}</Text>
						</View>
					) : (
						<FlatList
							data={queueEntries}
							keyExtractor={(item: FormQueueEntry) => item.id}
							renderItem={({ item }: { item: FormQueueEntry }) => (
								<TouchableOpacity
									style={{
										...styles.formCategory,
										backgroundColor: theme.screen.iconBg,
									}}
									onPress={() => {
										router.push({
											pathname: '/form-submission',
											params: { form_submission_id: item.form_submission_id, queue_entry_id: item.id },
										});
									}}
								>
									<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
										<MaterialCommunityIcons name="clock-outline" size={18} color={theme.screen.icon} />
										<Text style={{ ...styles.body, color: theme.screen.text, flex: 1 }}>{item.alias || item.form_submission_id}</Text>
									</View>
									<TouchableOpacity
										onPress={() => syncQueueEntry(item)}
										style={{ padding: 8 }}
										disabled={syncingId === item.id}
									>
										{syncingId === item.id ? (
											<ActivityIndicator size={20} color={theme.screen.icon} />
										) : (
											<MaterialCommunityIcons name="sync" size={22} color={theme.screen.icon} />
										)}
									</TouchableOpacity>
								</TouchableOpacity>
							)}
							contentContainerStyle={{ paddingBottom: 10 }}
						/>
					)
				) : loading ? (
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
				) : formSubmissions?.length > 0 ? (
					<FlatList data={listData} keyExtractor={item => item.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 10 }} />
				) : (
					<View style={{ padding: 20, alignItems: 'center' }}>
						<Text style={{ color: theme.screen.text, fontSize: 16 }}>{translate(TranslationKeys.no_data_found)}</Text>
					</View>
				)}
			</View>
		</View>
			<FilterFormSheet isVisible={isFilterModalVisible} closeSheet={closeFilterSheet} isFormSubmission={true} setSelectedOption={setSelectedOption} selectedOption={selectedOption} options={filterOptions} />
			{isActive && (
				<>
					<BaseBottomSheet
						ref={sortSheetRef}
						index={-1}
						backgroundStyle={{
							...styles.sheetBackground,
							backgroundColor: theme.sheet.sheetBg,
						}}
						enablePanDownToClose
						handleComponent={null}
						onClose={closeSortSheet}
					>
						<FormSubmissionSortSheet closeSheet={closeSortSheet} selectedOption={sortOption} setSelectedOption={setSortOption} />
					</BaseBottomSheet>
				</>
			)}
		</View>
	);
};

export default Index;
