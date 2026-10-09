import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { FeatureWishHelper, FeatureWishProgress, FeatureWishStatus } from 'repo-depkit-common';
import { SettingsListLikeButton } from 'repo-depkit-common-ui';
import SettingsList from '@/components/SettingsList';
import SettingsGroupTitle from '@/components/SettingsGroupTitle';
import ProjectButton from '@/components/ProjectButton';
import ModalTextInput from '@/components/ModalTextInput';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import useToast from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { SET_FEATURE_WISHES_LOCAL_DATA } from '@/redux/Types/types';
import { FeatureWish, FeatureWishesHelper } from '@/redux/actions/FeatureWishes/FeatureWishes';
import { TranslationKeys } from '@/locales/keys';
import { configureStore } from '@/redux/store';
import type { FeatureWishesLocalState } from '@/redux/Types/stateTypes';

type FeatureWishesLocal = FeatureWishesLocalState;

/** One entry of "Your wishes": the own row and, for a merged wish, the original it now counts for. */
type OwnWishEntry = {
	id: string;
	title: string;
	description: string | null;
	status: string;
	progress: string | null;
	dateUpdated: string | null;
	dateCreated: string | null;
	notePublic: string | null;
	relatedToId: string | null;
	original: FeatureWish | null;
	editable: boolean;
};

const PROGRESS_KEYS: Record<string, TranslationKeys> = {
	[FeatureWishProgress.COLLECTED]: TranslationKeys.feature_wishes_progress_collected,
	[FeatureWishProgress.PLANNED]: TranslationKeys.feature_wishes_progress_planned,
	[FeatureWishProgress.IN_PROGRESS]: TranslationKeys.feature_wishes_progress_in_progress,
	[FeatureWishProgress.RELEASED]: TranslationKeys.feature_wishes_progress_released,
	[FeatureWishProgress.NOT_PLANNED]: TranslationKeys.feature_wishes_progress_not_planned,
};

const POPULAR_LIMIT = 20;

function getGroupPosition(index: number, total: number): 'single' | 'top' | 'middle' | 'bottom' {
	if (total === 1) {
		return 'single';
	}
	if (index === 0) {
		return 'top';
	}
	return index === total - 1 ? 'bottom' : 'middle';
}

/** The device data straight from the store: modal content keeps the callbacks it was opened with, their values would be stale. */
function readFeatureWishesLocal(): FeatureWishesLocal {
	const local = configureStore.getState().settings.featureWishesLocal as Partial<FeatureWishesLocal> | undefined;
	return {
		tileHiddenAt: local?.tileHiddenAt ?? null,
		ownWishes: local?.ownWishes ?? [],
		likeIdsByWishId: local?.likeIdsByWishId ?? {},
		submittedAt: local?.submittedAt ?? [],
	};
}

const useFeatureWishesLocal = () => {
	const dispatch = useAppDispatch();
	const local = useAppSelector(state => state.settings.featureWishesLocal);
	const value: FeatureWishesLocal = useMemo(
		() => ({
			tileHiddenAt: local?.tileHiddenAt ?? null,
			ownWishes: local?.ownWishes ?? [],
			likeIdsByWishId: local?.likeIdsByWishId ?? {},
			submittedAt: local?.submittedAt ?? [],
		}),
		[local]
	);
	const update = useCallback((payload: Partial<FeatureWishesLocal>) => dispatch({ type: SET_FEATURE_WISHES_LOCAL_DATA, payload }), [dispatch]);
	return { local: value, update };
};

type FeatureWishFormProps = {
	initialTitle?: string;
	initialDescription?: string;
	onSubmit: (title: string, description: string | null) => Promise<void>;
};

/** The sub modal to submit or revise a wish. */
const FeatureWishForm: React.FC<FeatureWishFormProps> = ({ initialTitle, initialDescription, onSubmit }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const showToast = useToast();
	const [title, setTitle] = useState(initialTitle ?? '');
	const [description, setDescription] = useState(initialDescription ?? '');
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = useCallback(async () => {
		const text = FeatureWishHelper.validateText({ title, description });
		if (!text.ok) {
			showToast(translate(TranslationKeys.feature_wishes_title_missing), 'error');
			return;
		}
		Keyboard.dismiss();
		setSubmitting(true);
		try {
			await onSubmit(text.title, text.description);
		} catch (error) {
			console.error('Could not save the feature wish', error);
			showToast(translate(TranslationKeys.feature_wishes_error), 'error');
		} finally {
			setSubmitting(false);
		}
	}, [title, description, onSubmit, showToast, translate]);

	const inputStyle = [styles.input, { color: theme.screen.text, borderColor: theme.screen.placeholder }];

	return (
		<View style={styles.form}>
			<Text style={[styles.label, { color: theme.screen.text }]}>{translate(TranslationKeys.feature_wishes_field_title)}</Text>
			<ModalTextInput
				value={title}
				onChangeText={setTitle}
				maxLength={FeatureWishHelper.TITLE_MAX_LENGTH}
				style={inputStyle}
				placeholderTextColor={theme.screen.placeholder}
				accessibilityLabel={translate(TranslationKeys.feature_wishes_field_title)}
				autoFocus={!initialTitle}
			/>
			<Text style={[styles.counter, { color: theme.screen.placeholder }]}>{`${title.length} / ${FeatureWishHelper.TITLE_MAX_LENGTH}`}</Text>
			<Text style={[styles.label, { color: theme.screen.text }]}>{translate(TranslationKeys.feature_wishes_field_description)}</Text>
			<ModalTextInput
				value={description}
				onChangeText={setDescription}
				maxLength={FeatureWishHelper.DESCRIPTION_MAX_LENGTH}
				multiline
				numberOfLines={5}
				textAlignVertical="top"
				style={[inputStyle, styles.inputMultiline]}
				placeholderTextColor={theme.screen.placeholder}
				accessibilityLabel={translate(TranslationKeys.feature_wishes_field_description)}
			/>
			<Text style={[styles.hint, { color: theme.screen.placeholder, backgroundColor: theme.screen.iconBg }]}>{translate(TranslationKeys.feature_wishes_hint)}</Text>
			{submitting ? <ActivityIndicator style={styles.loading} color={theme.screen.text} /> : <ProjectButton text={translate(TranslationKeys.submit)} onPress={handleSubmit} />}
		</View>
	);
};

type FeatureWishesListProps = {
	openForm: (options: { wish?: OwnWishEntry }) => void;
	openDetails: (wish: FeatureWish) => void;
};

/**
 * Content of the feature wishes modal: submit button, own wishes, most liked published wishes.
 * The modal only renders its topmost content, so the list mounts again (and reloads) when a sub
 * modal goes back to it.
 */
const FeatureWishesList: React.FC<FeatureWishesListProps> = ({ openForm, openDetails }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const showToast = useToast();
	const { primaryColor, language } = useAppSelector(state => state.settings);
	const { profile } = useAppSelector(state => state.authReducer);
	const profileId: string | null = profile?.id ?? null;
	const { local, update } = useFeatureWishesLocal();
	const helper = useMemo(() => new FeatureWishesHelper(), []);

	const [loading, setLoading] = useState(true);
	const [popular, setPopular] = useState<FeatureWish[]>([]);
	const [ownEntries, setOwnEntries] = useState<OwnWishEntry[]>([]);
	const [likeIdsByWishId, setLikeIdsByWishId] = useState<Record<string, string>>(local.likeIdsByWishId);
	const [likeLoadingId, setLikeLoadingId] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const popularWishes = await helper.fetchPopular(POPULAR_LIMIT);
			let entries: OwnWishEntry[] = [];
			let likes: Record<string, string> = { ...local.likeIdsByWishId };

			if (profileId) {
				const ownRows = await helper.fetchOwn(profileId);
				likes = {};
				for (const row of ownRows) {
					const relatedToId = FeatureWishHelper.getRelatedToId(row);
					if (FeatureWishHelper.isLike(row) && relatedToId) {
						likes[relatedToId] = row.id;
					}
				}
				entries = ownRows
					.filter(row => !FeatureWishHelper.isLike(row))
					.map(row => ({
						id: row.id,
						title: row.title ?? '',
						description: row.description ?? null,
						status: row.status,
						progress: row.progress ?? null,
						dateUpdated: row.date_updated ?? null,
						dateCreated: row.date_created ?? null,
						notePublic: row.moderation_note_public ?? null,
						relatedToId: FeatureWishHelper.getRelatedToId(row),
						original: null,
						editable: FeatureWishHelper.isEditable(row),
					}));
			}

			// Wishes submitted on this device without account: also shown after signing in, they are
			// not linked to the profile.
			const serverIds = new Set(entries.map(entry => entry.id));
			const deviceWishes = local.ownWishes.filter(wish => !serverIds.has(wish.id));
			if (deviceWishes.length > 0) {
				const states = await helper.fetchStatesByIds(deviceWishes.map(wish => wish.id));
				const statesById = new Map(states.map(state => [state.id, state]));
				// Wishes the server no longer knows (deleted after being archived) disappear from the device too.
				const missingIds = new Set(deviceWishes.filter(wish => !statesById.has(wish.id)).map(wish => wish.id));
				if (missingIds.size > 0) {
					update({ ownWishes: local.ownWishes.filter(wish => !missingIds.has(wish.id)) });
				}
				const deviceEntries: OwnWishEntry[] = deviceWishes.filter(wish => statesById.has(wish.id)).map(wish => {
					const state = statesById.get(wish.id);
					return {
						id: wish.id,
						title: wish.title,
						description: null,
						status: state?.status ?? FeatureWishStatus.DRAFT,
						progress: state?.progress ?? null,
						dateUpdated: state?.date_updated ?? null,
						dateCreated: state?.date_created ?? null,
						notePublic: state?.moderation_note_public ?? null,
						relatedToId: state ? FeatureWishHelper.getRelatedToId(state) : null,
						original: null,
						// Without account nobody can prove the wish is theirs, so it cannot be edited.
						editable: false,
					};
				});
				entries = [...entries, ...deviceEntries];
			}

			// Merged wishes show the original they now count for (published, so readable for everyone).
			const originalIds = entries.filter(entry => entry.status === FeatureWishStatus.MERGED && entry.relatedToId).map(entry => entry.relatedToId as string);
			const originals = await helper.fetchByIds([...new Set(originalIds)]);
			const originalsById = new Map(originals.map(original => [original.id, original]));
			entries = entries.map(entry => (entry.status === FeatureWishStatus.MERGED && entry.relatedToId ? { ...entry, original: originalsById.get(entry.relatedToId) ?? null } : entry));
			setPopular(popularWishes);
			setOwnEntries(entries);
			setLikeIdsByWishId(likes);
		} catch (error) {
			console.error('Could not load feature wishes', error);
			showToast(translate(TranslationKeys.feature_wishes_error), 'error');
		} finally {
			setLoading(false);
		}
	}, [helper, profileId, local.ownWishes, local.likeIdsByWishId, update, showToast, translate]);

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profileId]);

	const toggleLike = useCallback(
		async (wish: FeatureWish) => {
			if (likeLoadingId) {
				return;
			}
			setLikeLoadingId(wish.id);
			const existingLikeId = likeIdsByWishId[wish.id];
			try {
				const nextLikes = { ...likeIdsByWishId };
				if (existingLikeId) {
					await helper.deleteItem(existingLikeId);
					delete nextLikes[wish.id];
				} else {
					nextLikes[wish.id] = await helper.createLike(wish.id);
				}
				const delta = existingLikeId ? -1 : 1;
				setLikeIdsByWishId(nextLikes);
				update({ likeIdsByWishId: nextLikes });
				setPopular(current => current.map(item => (item.id === wish.id ? { ...item, likes_amount: Math.max(0, (item.likes_amount ?? 0) + delta) } : item)));
			} catch (error) {
				console.error('Could not change the like of a feature wish', error);
				showToast(translate(TranslationKeys.feature_wishes_error), 'error');
			} finally {
				setLikeLoadingId(null);
			}
		},
		[likeLoadingId, likeIdsByWishId, helper, update, showToast, translate]
	);

	const formatDate = useCallback((date: Date) => date.toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' }), [language]);

	const getProgressLabel = useCallback((wish: Pick<FeatureWish, 'progress'>) => translate(PROGRESS_KEYS[wish.progress ?? FeatureWishProgress.COLLECTED] ?? TranslationKeys.feature_wishes_progress_collected), [translate]);

	const describeOwnEntry = useCallback(
		(entry: OwnWishEntry): string => {
			const lines: string[] = [];
			if (entry.status === FeatureWishStatus.ARCHIVED) {
				lines.push(translate(TranslationKeys.feature_wishes_status_declined));
				const deletionDate = FeatureWishHelper.getArchivedDeletionDate({ status: entry.status, date_updated: entry.dateUpdated, date_created: entry.dateCreated });
				if (deletionDate) {
					lines.push(`${translate(TranslationKeys.feature_wishes_removed_on)} ${formatDate(deletionDate)}`);
				}
				if (entry.editable) {
					lines.push(translate(TranslationKeys.feature_wishes_revise_hint));
				}
			} else if (entry.status === FeatureWishStatus.PUBLISHED) {
				lines.push(getProgressLabel(entry));
			} else if (entry.status === FeatureWishStatus.MERGED && entry.original) {
				lines.push(getProgressLabel(entry.original));
				lines.push(translate(TranslationKeys.feature_wishes_merged_hint));
			} else {
				lines.push(translate(TranslationKeys.feature_wishes_status_in_review));
			}
			if (entry.notePublic) {
				lines.push(`${translate(TranslationKeys.feature_wishes_note_from_team)}: ${entry.notePublic}`);
			}
			return lines.join('\n');
		},
		[translate, formatDate, getProgressLabel]
	);

	// Own wishes and the originals of own duplicates are already listed under "Your wishes".
	const ownIds = useMemo(() => new Set(ownEntries.flatMap(entry => (entry.original ? [entry.id, entry.original.id] : [entry.id]))), [ownEntries]);
	const popularOthers = useMemo(() => popular.filter(wish => !ownIds.has(wish.id)), [popular, ownIds]);

	const iconColor = theme.screen.icon;

	return (
		<View style={styles.list}>
			<ProjectButton
				text={translate(TranslationKeys.feature_wishes_submit)}
				onPress={() => openForm({})}
				iconLeft={<MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={theme.screen.text} />}
			/>
			{loading ? <ActivityIndicator style={styles.loading} color={theme.screen.text} /> : null}
			{!loading && ownEntries.length > 0 ? (
				<View>
					<SettingsGroupTitle>{translate(TranslationKeys.feature_wishes_own)}</SettingsGroupTitle>
					{ownEntries.map((entry, index) => (
						<SettingsList
							key={entry.id}
							iconBgColor={primaryColor}
							leftIcon={<MaterialCommunityIcons name="lightbulb-outline" size={24} color={iconColor} />}
							label={entry.original?.title ?? entry.title}
							value={describeOwnEntry(entry)}
							stackedValue
							rightIcon={entry.editable ? <Octicons name="pencil" size={20} color={iconColor} /> : undefined}
							handleFunction={entry.editable ? () => openForm({ wish: entry }) : undefined}
							groupPosition={getGroupPosition(index, ownEntries.length)}
						/>
					))}
				</View>
			) : null}
			{!loading ? (
				<View>
					<SettingsGroupTitle>{translate(TranslationKeys.feature_wishes_popular)}</SettingsGroupTitle>
					{popularOthers.length === 0 ? <Text style={[styles.empty, { color: theme.screen.placeholder }]}>{translate(TranslationKeys.feature_wishes_empty)}</Text> : null}
					{popularOthers.map((wish, index) => (
						<SettingsList
							key={wish.id}
							iconBgColor={primaryColor}
							leftIcon={<MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={iconColor} />}
							label={wish.title ?? ''}
							value={getProgressLabel(wish)}
							stackedValue
							handleFunction={() => openDetails(wish)}
							rightElement={
								<SettingsListLikeButton
									liked={!!likeIdsByWishId[wish.id]}
									likeCount={wish.likes_amount ?? 0}
									likeLoading={likeLoadingId === wish.id}
									onPressLike={() => toggleLike(wish)}
									primaryColor={primaryColor}
								/>
							}
							groupPosition={getGroupPosition(index, popularOthers.length)}
						/>
					))}
				</View>
			) : null}
		</View>
	);
};

/**
 * Opens the feature wishes modal (from the tile in the food offers and from the settings). Submitting
 * and revising happen in a sub modal on top, its back chevron returns to the list.
 */
export const useFeatureWishesModal = () => {
	const { show, close } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const showToast = useToast();
	const { update } = useFeatureWishesLocal();
	const { profile } = useAppSelector(state => state.authReducer);
	const profileId: string | null = profile?.id ?? null;
	const helper = useMemo(() => new FeatureWishesHelper(), []);

	const openDetails = useCallback(
		(wish: FeatureWish) => {
			show({
				title: wish.title ?? '',
				children: <FeatureWishDetails wish={wish} />,
			});
		},
		[show]
	);

	const openForm = useCallback(
		({ wish }: { wish?: OwnWishEntry }) => {
			if (!wish && !FeatureWishHelper.maySubmitAnotherWish(readFeatureWishesLocal().submittedAt, new Date())) {
				showToast(translate(TranslationKeys.feature_wishes_daily_limit), 'error');
				return;
			}
			show({
				title: translate(TranslationKeys.feature_wishes_form_title),
				children: (
					<FeatureWishForm
						initialTitle={wish?.title}
						initialDescription={wish?.description ?? undefined}
						onSubmit={async (title, description) => {
							if (wish) {
								await helper.updateText(wish.id, title, description);
								showToast(translate(TranslationKeys.feature_wishes_updated), 'success');
							} else {
								const id = await helper.createWish(title, description);
								const now = new Date();
								const latest = readFeatureWishesLocal();
								update({
									submittedAt: [...FeatureWishHelper.getRecentSubmissions(latest.submittedAt, now), now.toISOString()],
									ownWishes: profileId ? latest.ownWishes : [{ id, title }, ...latest.ownWishes],
								});
								showToast(translate(TranslationKeys.feature_wishes_submitted), 'success');
							}
							close();
						}}
					/>
				),
			});
		},
		[profileId, helper, show, close, showToast, translate, update]
	);

	const openFeatureWishesModal = useCallback(() => {
		show({
			title: translate(TranslationKeys.feature_wishes),
			children: <FeatureWishesList openForm={openForm} openDetails={openDetails} />,
		});
	}, [show, translate, openForm, openDetails]);

	return { openFeatureWishesModal };
};

/** Details of a published wish: description and a note of the team. */
const FeatureWishDetails: React.FC<{ wish: FeatureWish }> = ({ wish }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	return (
		<View style={styles.form}>
			{wish.description ? <Text style={[styles.detailText, { color: theme.screen.text }]}>{wish.description}</Text> : null}
			{wish.moderation_note_public ? (
				<Text style={[styles.hint, { color: theme.screen.placeholder, backgroundColor: theme.screen.iconBg }]}>
					{`${translate(TranslationKeys.feature_wishes_note_from_team)}: ${wish.moderation_note_public}`}
				</Text>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	list: {
		paddingBottom: 24,
	},
	form: {
		gap: 8,
		paddingBottom: 24,
	},
	label: {
		fontSize: 14,
		fontFamily: 'Poppins_600SemiBold',
	},
	input: {
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
	},
	inputMultiline: {
		minHeight: 110,
	},
	counter: {
		fontSize: 12,
		textAlign: 'right',
	},
	hint: {
		fontSize: 13,
		lineHeight: 19,
		borderRadius: 10,
		padding: 12,
		marginTop: 8,
	},
	detailText: {
		fontSize: 15,
		lineHeight: 22,
	},
	empty: {
		fontSize: 14,
		paddingVertical: 8,
	},
	loading: {
		marginVertical: 20,
	},
});
