import React, { useCallback } from 'react';
import { Platform, View } from 'react-native';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import SettingsList from '@/components/SettingsList';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import useToast from '@/hooks/useToast';
import { TranslationKeys } from '@/locales/keys';

export type LinkCoordinate = {
	latitude: number;
	longitude: number;
};

type OpenLinkCoordinateModalOptions = {
	latlon: LinkCoordinate;
};

const useLinkCoordinateModal = () => {
	const { show, close } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const toast = useToast();

	const closeModal = useCallback(() => {
		close();
	}, [close]);

	const openLinkCoordinateModal = useCallback(
		({ latlon }: OpenLinkCoordinateModalOptions) => {
			if (!latlon || !Number.isFinite(latlon.latitude) || !Number.isFinite(latlon.longitude)) {
				console.error('Invalid coordinates');
				return;
			}

			const coordinateString = `${latlon.latitude}, ${latlon.longitude}`;
			const googleMapsUrl = CommonSystemActionHelper.getGoogleMapsUrl(latlon.latitude, latlon.longitude);
			const appleMapsUrl =
				Platform.OS === 'ios'
					? `maps://?q=${latlon.latitude},${latlon.longitude}`
					: `https://maps.apple.com/?q=${latlon.latitude},${latlon.longitude}`;

			const handleOpenGoogleMaps = async () => {
				await CommonSystemActionHelper.openExternalURL(googleMapsUrl, true);
				closeModal();
			};

			const handleOpenAppleMaps = async () => {
				await CommonSystemActionHelper.openExternalURL(appleMapsUrl, true);
				closeModal();
			};

			const handleCopyCoordinates = async () => {
				const copied = await Clipboard.setStringAsync(coordinateString);
				if (copied) {
					toast(translate(TranslationKeys.copied), 'success');
				}
				closeModal();
			};

			const options = [
				{
					key: 'google-maps',
					label: translate(TranslationKeys.open_in_google_maps),
					icon: <MaterialCommunityIcons name="google-maps" size={24} />,
					onPress: handleOpenGoogleMaps,
				},
				{
					key: 'apple-maps',
					label: translate(TranslationKeys.open_in_apple_maps),
					icon: <MaterialCommunityIcons name="apple" size={24} />,
					onPress: handleOpenAppleMaps,
				},
			];

			show({
				title: translate(TranslationKeys.location_information),
				onClose: closeModal,
				children: (
					<View style={{ gap: 12 }}>
						<View>
							{options.map((option, index) => {
								let groupPosition: 'single' | 'top' | 'bottom' | 'middle';
								if (options.length === 1) {
									groupPosition = 'single';
								} else if (index === 0) {
									groupPosition = 'top';
								} else if (index === options.length - 1) {
									groupPosition = 'bottom';
								} else {
									groupPosition = 'middle';
								}

								return (
									<SettingsList
										key={option.key}
										label={option.label}
										leftIcon={option.icon}
										rightIcon={<Entypo name="chevron-small-right" size={26} color={theme.screen.icon} />}
										handleFunction={option.onPress}
										groupPosition={groupPosition}
										showSeparator={index !== options.length - 1}
									/>
								);
							})}
						</View>
						<SettingsList
							label={translate(TranslationKeys.copy_coordinates)}
							value={coordinateString}
							leftIcon={<MaterialCommunityIcons name="content-copy" size={24} />}
							rightIcon={<MaterialCommunityIcons name="content-copy" size={24} color={theme.screen.icon} />}
							handleFunction={handleCopyCoordinates}
							groupPosition="single"
							showSeparator={false}
						/>
					</View>
				),
			});
		},
		[closeModal, show, theme, toast, translate]
	);

	return { openLinkCoordinateModal, closeLinkCoordinateModal: closeModal };
};

export default useLinkCoordinateModal;
