import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { SettingsList, SettingsListGroupTitle, useTheme } from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';
import { setGameTypeIcon, setGameTypeImageUrl } from '../store/gameTypesSlice';
import type { AppDispatch, RootState } from '../store/store';
import type { ImageSearchResult } from '../helpers/ImageSearch';
import { isGoogleImageSearchConfigured, searchImages } from '../helpers/ImageSearch';
import { GAME_TYPE_ICONS } from '../helpers/GameTypesStorage';
import { ImagePickerUnavailableError, MAX_IMAGE_SIZE, describeImageSize, isInlineImage, pickGameImageAsDataUri } from '../helpers/GameImageUpload';
import { ComponentIds } from '../constants/ComponentIds';

// The sheet's keyboard tracking only sees BottomSheetTextInput; web has no
// sheet keyboard handling and RN-web's BottomSheetTextInput blur handler
// throws, so it falls back to the plain input (same pattern as elsewhere).
const ResolvedTextInput = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;

const PRIMARY_COLOR = '#2563eb';
const DANGER_COLOR = '#dc2626';
const GRID_COLUMNS = 2;
const GRID_GAP = 10;
const SHEET_HORIZONTAL_PADDING = 40; // MyScrollViewModal's 20pt padding on both sides

/**
 * The search term, shared between the modal's sticky header and its content -
 * the two are separate element trees (`stickyHeaderComponent` vs `children`),
 * so they can't share React state directly. Same approach the avatar editor
 * uses for its live preview.
 */
export class ImageQueryObservable {
	private query: string;
	private readonly listeners = new Set<(query: string) => void>();

	constructor(initialQuery: string) {
		this.query = initialQuery;
	}

	get(): string {
		return this.query;
	}

	set(query: string): void {
		this.query = query;
		for (const listener of this.listeners) listener(query);
	}

	subscribe(listener: (query: string) => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
}

// ─── Sticky search header ─────────────────────────────────────────────────────

export function GameImageSearchHeader({ observable }: Readonly<{ observable: ImageQueryObservable }>) {
	const { theme } = useTheme();
	const [query, setQuery] = useState(observable.get());

	const handleChange = useCallback(
		(value: string) => {
			setQuery(value);
			observable.set(value);
		},
		[observable],
	);

	return (
		<View style={[styles.searchWrapper, { backgroundColor: theme.screen.background }]}>
			<View style={[styles.searchBar, { backgroundColor: theme.screen.iconBg }]}>
				<Ionicons name="search-outline" size={18} color={theme.screen.icon} />
				<ResolvedTextInput
					nativeID={ComponentIds.GAME_IMAGE_SEARCH_INPUT}
					style={[styles.searchInput, { color: theme.screen.text }]}
					value={query}
					onChangeText={handleChange}
					placeholder="Suchbegriff, z.B. Skat Logo"
					placeholderTextColor={theme.screen.placeholder}
					returnKeyType="search"
					autoCorrect={false}
				/>
				{query.length > 0 && (
					<TouchableOpacity onPress={() => handleChange('')} hitSlop={8}>
						<Ionicons name="close-circle" size={18} color={theme.screen.icon} />
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
}

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * Runs the image search for the query the sticky header publishes: debounced
 * while typing, cancelling the previous request, and never throwing at the UI
 * (a failed search becomes an error message instead).
 */
function useImageSearch(observable: ImageQueryObservable) {
	const [query, setQuery] = useState(observable.get());
	const [results, setResults] = useState<ImageSearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => observable.subscribe(setQuery), [observable]);

	useEffect(() => {
		const trimmed = query.trim();
		if (trimmed === '') {
			setResults([]);
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setIsLoading(true);
		const timer = setTimeout(() => {
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;
			setError(null);
			searchImages(trimmed, { limit: 20, signal: controller.signal })
				.then((found) => {
					if (!cancelled) setResults(found);
				})
				.catch(() => {
					if (cancelled) return;
					setError('Bildersuche nicht erreichbar. Prüfe die Internetverbindung.');
					setResults([]);
				})
				.finally(() => {
					if (!cancelled) setIsLoading(false);
				});
		}, 400);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [query]);

	return { query, results, isLoading, error };
}

// ─── Picker body ──────────────────────────────────────────────────────────────

/**
 * Two-column grid of found images, plus the emoji fallback and a way back to no
 * picture at all. Picking stores only the image's URL on the game (see
 * helpers/ImageSearch); subscribes to the store so the current selection stays
 * marked while the modal is open.
 */
export function GameImagePickerContent({
	gameTypeId,
	observable,
	onPicked,
}: Readonly<{ gameTypeId: string; observable: ImageQueryObservable; onPicked: () => void }>) {
	const dispatch = useDispatch<AppDispatch>();
	const { theme } = useTheme();
	const { width } = useWindowDimensions();
	const gameType = useSelector((state: RootState) => state.gameTypes.gameTypes.find((g) => g.id === gameTypeId));
	const { query, results, isLoading, error } = useImageSearch(observable);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const tileWidth = Math.floor((width - SHEET_HORIZONTAL_PADDING - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

	if (!gameType) return null;
	const selectedImageUrl = gameType.imageUrl ?? null;

	const handlePickOwnImage = useCallback(
		async (source: 'library' | 'camera') => {
			setUploadError(null);
			setIsUploading(true);
			try {
				const dataUri = await pickGameImageAsDataUri(source);
				if (dataUri) {
					dispatch(setGameTypeImageUrl({ gameTypeId, imageUrl: dataUri }));
					onPicked();
				}
			} catch (err) {
				console.warn('[GameImagePicker] own image failed:', err);
				setUploadError(
					err instanceof ImagePickerUnavailableError ? err.message : 'Das Bild konnte nicht übernommen werden.',
				);
			} finally {
				setIsUploading(false);
			}
		},
		[dispatch, gameTypeId, onPicked],
	);

	return (
		<View style={styles.content}>
			<SettingsListGroupTitle title="Eigenes Bild" />
			<SettingsList
				nativeID={ComponentIds.GAME_IMAGE_UPLOAD_ROW}
				label="Bild auswählen"
				value={
					isInlineImage(selectedImageUrl)
						? `Eigenes Bild gespeichert (${describeImageSize(selectedImageUrl!)})`
						: `Aus der Galerie, wird auf max. ${MAX_IMAGE_SIZE} px verkleinert`
				}
				stackedValue
				leftIcon={<Ionicons name="image-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				rightElement={isUploading ? <ActivityIndicator size="small" color={PRIMARY_COLOR} /> : undefined}
				handleFunction={isUploading ? undefined : () => handlePickOwnImage('library')}
				groupPosition="top"
			/>
			<SettingsList
				nativeID={ComponentIds.GAME_IMAGE_CAMERA_ROW}
				label="Foto aufnehmen"
				leftIcon={<Ionicons name="camera-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				handleFunction={isUploading ? undefined : () => handlePickOwnImage('camera')}
				groupPosition="bottom"
			/>
			{uploadError !== null && <Text style={[styles.hint, { color: DANGER_COLOR }]}>{uploadError}</Text>}

			<SettingsListGroupTitle title="Bild suchen" />
			{error !== null && <Text style={[styles.hint, { color: DANGER_COLOR }]}>{error}</Text>}
			{error === null && isLoading && results.length === 0 && (
				<View style={styles.loadingBlock}>
					<ActivityIndicator size="large" color={PRIMARY_COLOR} />
					<Text style={[styles.hint, { color: theme.screen.placeholder }]}>Suche „{query.trim()}“ …</Text>
				</View>
			)}
			{error === null && !isLoading && results.length === 0 && query.trim() !== '' && (
				<Text style={[styles.hint, { color: theme.screen.placeholder }]}>
					Keine Bilder für „{query.trim()}“ gefunden. Probiere einen anderen Suchbegriff.
				</Text>
			)}

			<View style={styles.grid}>
				{results.map((result) => {
					const isSelected = selectedImageUrl === result.url;
					return (
						<TouchableOpacity
							key={result.id}
							id={`${ComponentIds.GAME_IMAGE_RESULT_PREFIX}${result.id}`}
							style={[
								styles.gridItem,
								{
									width: tileWidth,
									borderColor: isSelected ? PRIMARY_COLOR : theme.screen.border,
									backgroundColor: theme.screen.iconBg,
								},
							]}
							onPress={() => {
								dispatch(setGameTypeImageUrl({ gameTypeId, imageUrl: result.url }));
								onPicked();
							}}
							activeOpacity={0.8}
						>
							<Image
								source={{ uri: result.thumbnailUrl }}
								style={[styles.gridImage, { width: tileWidth - 8 }]}
								resizeMode="cover"
							/>
							<Text style={[styles.gridCaption, { color: theme.screen.placeholder }]} numberOfLines={1}>
								{result.source}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>

			<SettingsListGroupTitle title="Emoji statt Bild" />
			<View style={styles.iconGrid}>
				{GAME_TYPE_ICONS.map((icon) => {
					const isSelected = !selectedImageUrl && icon === gameType.icon;
					return (
						<TouchableOpacity
							key={icon}
							id={`${ComponentIds.GAME_IMAGE_ICON_PREFIX}${icon}`}
							style={[
								styles.iconGridItem,
								{
									borderColor: isSelected ? PRIMARY_COLOR : theme.screen.border,
									backgroundColor: isSelected ? PRIMARY_COLOR + '20' : 'transparent',
								},
							]}
							onPress={() => {
								dispatch(setGameTypeIcon({ gameTypeId, icon }));
								dispatch(setGameTypeImageUrl({ gameTypeId, imageUrl: null }));
								onPicked();
							}}
							activeOpacity={0.7}
						>
							<Text style={styles.iconGridEmoji}>{icon}</Text>
						</TouchableOpacity>
					);
				})}
			</View>

			{selectedImageUrl !== null && (
				<SettingsList
					nativeID={ComponentIds.GAME_IMAGE_REMOVE_ROW}
					label="Bild entfernen"
					value="Zurück zum Emoji"
					leftIcon={<Ionicons name="close-circle-outline" size={20} color="#ffffff" />}
					iconBgColor={DANGER_COLOR}
					handleFunction={() => {
						dispatch(setGameTypeImageUrl({ gameTypeId, imageUrl: null }));
						onPicked();
					}}
					groupPosition="single"
				/>
			)}

			{!isGoogleImageSearchConfigured() && (
				<Text style={[styles.hint, { color: theme.screen.placeholder }]}>
					Ohne hinterlegten Google-API-Schlüssel (siehe app.config.ts) wird bei BoardGameGeek, Wikimedia Commons und
					Openverse gesucht - die beiden letzten führen nur Creative-Commons-Bilder. Für alles andere: eigenes Bild
					auswählen.
				</Text>
			)}
		</View>
	);
}

export { defaultImageQuery } from '../helpers/ImageSearch';

const styles = StyleSheet.create({
	content: {
		paddingBottom: 8,
	},
	searchWrapper: {
		paddingVertical: 8,
	},
	searchBar: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderRadius: 10,
		paddingHorizontal: 12,
		height: 42,
	},
	searchInput: {
		flex: 1,
		fontSize: 15,
		height: '100%',
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: GRID_GAP,
		paddingTop: 8,
	},
	gridItem: {
		borderWidth: 2,
		borderRadius: 12,
		padding: 2,
		alignItems: 'center',
	},
	gridImage: {
		height: 110,
		borderRadius: 10,
	},
	gridCaption: {
		fontSize: 10,
		paddingVertical: 3,
	},
	loadingBlock: {
		alignItems: 'center',
		gap: 8,
		paddingVertical: 24,
	},
	hint: {
		fontSize: 13,
		paddingHorizontal: 4,
		paddingVertical: 10,
	},
	iconGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		paddingVertical: 6,
		justifyContent: 'center',
	},
	iconGridItem: {
		width: 52,
		height: 52,
		borderRadius: 12,
		borderWidth: 2,
		justifyContent: 'center',
		alignItems: 'center',
	},
	iconGridEmoji: {
		fontSize: 26,
	},
});
