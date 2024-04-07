import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {
	Canteens,
	Devices,
	DirectusUsers,
	FoodsFeedbacks,
	Markings,
	Profiles,
	ProfilesBuildingsFavorites,
	ProfilesBuildingsLastVisited,
	ProfilesMarkings
} from '@/helper/database/databaseTypes/types';
import {useSynchedResourceSingleRaw} from '@/states/SynchedResource';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useSynchedCanteensDict} from '@/states/SynchedCanteens';
import {useIsCurrentUserAnonymous} from '@/states/User';
import {useIsServerOnline} from '@/states/SyncStateServerInfo';
import {DirectusTranslationHelper} from '@/helper/translations/DirectusTranslationHelper';
import {LocationType} from "@/helper/geo/LocationType";
import {useSynchedBuildingsDict} from "@/states/SynchedBuildings";
import {CoordinateHelper} from "@/helper/geo/CoordinateHelper";
import {useCallback, useMemo} from "react";
import {useSyncState} from "@/helper/syncState/SyncState";
import {NonPersistentStore} from "@/helper/syncState/NonPersistentStore";

async function loadProfileRemoteByProfileId(id: string) {
	const profileRelations = ['markings', 'devices', 'buildings_favorites', 'buildings_last_visited']
	const profileFields = profileRelations.map(x => x+'.*').concat(['*']);

	const deepFields: Record<string, { _limit: number }> = profileRelations.reduce((acc, x) => {
		acc[x] = { _limit: -1 };
		return acc;
	}, {} as Record<string, { _limit: number }>);

	const usersProfileId: string = id;
	console.log('usersProfileId: ',usersProfileId)
	console.log('Okay lets load from remote')
	const profileCollectionHelper = new CollectionHelper<Profiles>('profiles')
	return await profileCollectionHelper.readItem(usersProfileId, {
		fields: profileFields,
		deep: deepFields,
	});
}

export async function deleteProfileRemote(id: string | number) {
	const profileCollectionHelper = new CollectionHelper<Profiles>('profiles')
	await profileCollectionHelper.deleteItem(id);
}

export async function loadProfileRemoteByUser(user: DirectusUsers | undefined) {
	console.log('loadProfileRemote');
	console.log('user', user)
	if (user) {
		const usersProfileId: string = user.profile as unknown as string
		console.log('usersProfileId: ',usersProfileId)
		if (usersProfileId) {
			return await loadProfileRemoteByProfileId(usersProfileId);
		}
	}
	return undefined;
}

export async function updateProfileRemote(id: string | number, profile: Partial<Profiles>) {
	console.log('updateProfileRemote')
	console.log('id: ', id)
	console.log('profile: ', profile)
	const profileCollectionHelper = new CollectionHelper<Profiles>('profiles')
	await profileCollectionHelper.updateItem(id, profile);
	return await loadProfileRemoteByProfileId(id as string);
}

export function useSynchedProfile(): [Partial<Profiles>, (callback: (currentValue: Partial<Profiles> | null | undefined) => Partial<Profiles> | null | undefined, timestamp?: number | undefined) => void, number | undefined] {
	const [resourceOnly, setResource, resourceRaw, setResourceRaw] = useSynchedResourceSingleRaw<Partial<Profiles>>(PersistentStore.profile);
	const isServerOnline = useIsServerOnline()
	const isCurrentUserAnonymous = useIsCurrentUserAnonymous();

	const usedSetResource = useCallback(
		(callback: (currentValue: Partial<Profiles> | null | undefined) => Partial<Profiles> | null | undefined, timestamp?: number | undefined) => {
			console.log("setProfile, isServerOnline: ", isServerOnline, "isCurrentUserAnonymous: ", isCurrentUserAnonymous)
			if (isServerOnline && !isCurrentUserAnonymous) {
				setResource((currentValue) => {
					const newValue = callback(currentValue);
					const profile_id = newValue?.id || currentValue?.id;

					if (profile_id && newValue) {
						console.log('profile_id: ', profile_id);

						updateProfileRemote(profile_id, newValue).then((remoteAnswer) => {
							console.log('remoteAnswer: ', remoteAnswer);
						}).catch((err) => {
							console.log(err);
						});

						return newValue;
					} else {
						console.error('Profile ID not found');
						return newValue;
					}
				}, timestamp);
			} else {
				return setResource(callback, timestamp);
			}
		},
		// Dependencies for useCallback
		[isServerOnline, isCurrentUserAnonymous, setResource]
	);


	let usedResource = resourceOnly;
	if (!usedResource) {
		usedResource = {}
	}

	const lastUpdate = resourceRaw?.lastUpdate;

	return [usedResource, usedSetResource, lastUpdate]
}

export enum PriceGroups {
    Student = 'student',
    Employee = 'employee',
    Guest = 'guest'
}
export function useProfilePriceGroup(): [PriceGroups, ((newValue: string) => void)] {
	const [profile, setProfile] = useSynchedProfile();

	let usedPriceGroup = PriceGroups.Student;
	const profilePriceGroup = profile?.price_group;
	if (profilePriceGroup) {
		// check if profilePriceGroup is a valid PriceGroup
		if (profilePriceGroup === PriceGroups.Student || profilePriceGroup === PriceGroups.Employee || profilePriceGroup === PriceGroups.Guest) {
			usedPriceGroup = profilePriceGroup;
		}
	}

	const setPriceGroup = useCallback((priceGroup: string) => {
		setProfile((currentProfile) => {
			if(currentProfile){
				currentProfile.price_group = priceGroup;
			}
			return currentProfile;
		})
	}, [setProfile]);



	return [usedPriceGroup, setPriceGroup];
}

export function useNickname(): [string | null | undefined, ((newValue: string | undefined) => boolean | void)] {
	const [profile, setProfile, lastUpdateProfile] = useSynchedProfile()
	const setNickname = useCallback((nickname: string | undefined) => {
		setProfile((currentValue) => {
			if(currentValue){
				currentValue.nickname = nickname;
			}
			return currentValue;
		});
	}, [setProfile]);
	const nickname = profile?.nickname
	return [nickname, setNickname]
}

export function useEstimatedLocationUponSelectedCanteen(): LocationType | null {
	let [canteen, setCanteen] = useSynchedProfileCanteen();
	const [buildingDict, setBuildingDict] = useSynchedBuildingsDict()
	let building_id = canteen?.building as string;
	let building = buildingDict?.[building_id];
	let coordinates = building?.coordinates;
	let location = CoordinateHelper.getLocation(coordinates);
	return location;
}

export function useProfileLanguageCode(): [string, ((newValue: string) => void)] {
	const [profile, setProfile] = useSynchedProfile();
	const setLanguage = useCallback((language: string) => {
			setProfile((currentValue) => {
				if(currentValue){
					currentValue.language = language;
				}
				return currentValue;
			});
		},
		[setProfile]
	);
	let usedLanguage: string = DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE_GERMAN;
	const profileLanguage = profile?.language;
	if (profileLanguage) {
		if (typeof profileLanguage !== 'string') {
			usedLanguage = profileLanguage.code
		} else {
			usedLanguage = profileLanguage;
		}
	}

	return [usedLanguage, setLanguage];
}

export function useProfileLocaleForJsDate(): string {
	const [language, setLanguage] = useProfileLanguageCode();
	let locale = language;
	if (locale) {
		locale = locale.toLowerCase() //"en-US" --> "en-us"; since js uses lowercase
	}
	// TODO: check if locale is valid as ISO 639-1 code or something like that
	return locale;
}

export function useSynchedProfileCanteen(): [Canteens | null | undefined, ((newValue: Canteens | null) => void)] {
	const [profile, setProfile] = useSynchedProfile();
	const [canteenDict, setCanteenDict] = useSynchedCanteensDict();

	const canteen_id = profile?.canteen as string;
	let canteen = undefined
	if (canteenDict && canteen_id) {
		canteen = canteenDict[canteen_id];
	}

	const setCanteen = useCallback((newValue: Canteens | null) => {
		setProfile((currentValue) => {
			if(currentValue){
				if(newValue === null) {
					currentValue.canteen = null;
					return currentValue;
				} else {
					currentValue.canteen = newValue.id;
					return currentValue;
				}
			}
		});
	}, [setProfile]);

	return [canteen, setCanteen];
}

export function useAccountBalance(): [number | null | undefined, ((newValue: number | null | undefined) => void)] {
	const [profile, setProfile] = useSynchedProfile();
	const setAccountBalance = useCallback((newValue: number | null | undefined) => {
		setProfile((currentValue) => {
			if (currentValue) {
				currentValue.credit_balance = newValue;
			}
			return currentValue;
		});
	}, [setProfile]);
	return [profile?.credit_balance, setAccountBalance];
}

export function useSynchedProfileMarkingsDict(): [Record<string, ProfilesMarkings>, (marking_id: string, dislikes: boolean) => void, (marking_id: string) => void] {
	//const [profile, setProfile] = useSynchedProfile();
	const [profile, setProfile] = useSyncState<Profiles>(PersistentStore.test);

	const profileMarkingsList: ProfilesMarkings[] = profile?.markings || [];

	let markingsDictDep = "";
	for (let i=0; i<profileMarkingsList.length; i++) {
		const profilesMarking = profileMarkingsList[i];
		markingsDictDep += ""+profilesMarking.dislikes + profilesMarking.markings_id;
	}

	const useProfilesMarkingsDict = useCallback(() => {
		const profilesMarkingsDict: Record<string, ProfilesMarkings> = {};
		for (let i=0; i<profileMarkingsList.length; i++) {
			const profilesMarking = profileMarkingsList[i];
			const markings_key = profilesMarking.markings_id;
			markingsDictDep += ""+profilesMarking.dislikes + profilesMarking.markings_id;
			if (!!markings_key && typeof profilesMarking.markings_id === 'string') {
				profilesMarkingsDict[profilesMarking.markings_id] = profilesMarking;
			}
		}
		return profilesMarkingsDict;
	}, [markingsDictDep]);

	const profilesMarkingsDict: Record<string, ProfilesMarkings> = useProfilesMarkingsDict();

	const privateSetMarkings = useCallback((marking_id: string, dislikes: boolean, remove: boolean) => {
		//const markingsDictCopy = JSON.parse(JSON.stringify(profilesMarkingsDict));
		setProfile((currentProfile) => {
			if(currentProfile){
				const newProfileMarking: Partial<ProfilesMarkings> = {
					markings_id: marking_id,
					profiles_id: currentProfile?.id,
					dislikes: dislikes
				};
				let currentProfileMarkings = currentProfile?.markings || [];
				currentProfileMarkings.push(newProfileMarking as ProfilesMarkings);

				if (remove) {
					currentProfileMarkings = currentProfileMarkings.filter((x) => x.markings_id !== marking_id);
				}

				currentProfile.markings = currentProfileMarkings;
			}
			return currentProfile;
		});
	}, [setProfile]);

	const setProfileMarking = useCallback((marking_id: string, dislikes: boolean) => {
		privateSetMarkings(marking_id, dislikes, false);
	}, [privateSetMarkings]);

	const removeProfileMarking = useCallback((marking_id: string) => {
		privateSetMarkings(marking_id, false, true);
	}, [privateSetMarkings]);


	return [profilesMarkingsDict, setProfileMarking, removeProfileMarking];
}

export function useSynchedProfileMarking(marking_id: string): [boolean | null | undefined, (dislikes: boolean) => void, () => void] {
	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();

	const setMarking = useCallback((dislikes: boolean) => {
		setProfileMarking(marking_id, dislikes);
	}, [marking_id]);

	const removeMarking = useCallback(() => {
		removeProfileMarking(marking_id);
	}, [marking_id]);

	const dislikes = profilesMarkingsDict[marking_id]?.dislikes;

	return [dislikes, setMarking, removeMarking];
}

export function getEmptyProfile(): Partial<Profiles> {
	const undefinedBuildingsFavorites = undefined as any as string & ProfilesBuildingsFavorites[];
	const undefinedBuildingsLastVisited = undefined as any as string & ProfilesBuildingsLastVisited[];
	const undefinedDevices = undefined as any as string & Devices[];
	const undefinedFoodsFeedbacks = undefined as any as string & FoodsFeedbacks[];
	const undefinedMarkings = undefined as any as string & ProfilesMarkings[];

	return {
		buildings_favorites: undefinedBuildingsFavorites,
		buildings_last_visited: undefinedBuildingsLastVisited,
		devices: undefinedDevices,
		foods_feedbacks: undefinedFoodsFeedbacks,
		canteen: undefined,
		markings: undefinedMarkings,
		nickname: 'Gast'
	}
}