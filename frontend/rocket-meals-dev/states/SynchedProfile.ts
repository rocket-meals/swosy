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

export function useSynchedProfile(): [(Partial<Profiles>), ((newValue: Partial<Profiles>, timestamp?: number) => Promise<(boolean | void)>), (number | undefined)] {
	const [resourceOnly, setResource, resourceRaw, setResourceRaw] = useSynchedResourceSingleRaw<Partial<Profiles>>(PersistentStore.profile);
	const isServerOnline = useIsServerOnline()
	const isCurrentUserAnonymous = useIsCurrentUserAnonymous();

	const lastUpdate = resourceRaw?.lastUpdate;
	let usedSetResource: (newValue: Partial<Profiles>, timestamp?: number) => Promise<(boolean | void)> = async (newValue, timestamp) => {
		return setResource(newValue, timestamp);
	};
	if (isServerOnline && !isCurrentUserAnonymous) {
		usedSetResource = async (newValue: Partial<Profiles>, timestamp?: number) => {
			console.log('useSynchedProfile setProfile online');
			const profile_id = newValue?.id || resourceOnly?.id;
			console.log('profile_id: ', profile_id)
			if (profile_id) {
				try {

					// Sync with remote
					//const remoteAnswer = await updateProfileRemote(profile_id, newValue);
					//console.log('remoteAnswer: ', remoteAnswer)

					updateProfileRemote(profile_id, newValue).then((remoteAnswer) => {
						console.log('remoteAnswer: ', remoteAnswer)
					}).catch((err) => {
						console.log(err)
					})

					setResource(newValue, timestamp);
					return true;
				} catch (err) {
					console.log(err)
					return false;
				}
			} else {
				setResource(newValue, timestamp);
				return true;
			}
		}
	}
	let usedResource = resourceOnly;
	if (!usedResource) {
		usedResource = {}
	}
	return [usedResource, usedSetResource, lastUpdate]
}

export enum PriceGroups {
    Student = 'student',
    Employee = 'employee',
    Guest = 'guest'
}
export function useProfilePriceGroup(): [PriceGroups, ((newValue: string) => void)] {
	const [profile, setProfile] = useSynchedProfile();
	const setPriceGroup = (priceGroup: string) => {
		profile.price_group = priceGroup;
		return setProfile(profile);
	}

	let usedPriceGroup = PriceGroups.Student;
	const profilePriceGroup = profile?.price_group;
	if (profilePriceGroup) {
		// check if profilePriceGroup is a valid PriceGroup
		if (profilePriceGroup === PriceGroups.Student || profilePriceGroup === PriceGroups.Employee || profilePriceGroup === PriceGroups.Guest) {
			usedPriceGroup = profilePriceGroup;
		}
	}


	return [usedPriceGroup, setPriceGroup];
}

export function useNickname(): [string | null | undefined, ((newValue: string | undefined) => Promise<boolean | void>)] {
	const [profile, setProfile, lastUpdateProfile] = useSynchedProfile()
	async function setNickname(nextValue: string | undefined) {
		console.log('SettingsRowProfileNickname onSave', nextValue)
		return await setProfile({...profile, nickname: nextValue})
	}
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
	const setLanguage = (language: string) => {
		profile.language = language;
		return setProfile(profile);
	}
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

export function useSynchedProfileCanteen(): [Canteens | undefined, ((newValue: Canteens | null) => void)] {
	const [profile, setProfile] = useSynchedProfile();
	const [canteenDict, setCanteenDict] = useSynchedCanteensDict();

	const canteen_id = profile?.canteen as string;
	let canteen = undefined
	if (canteenDict && canteen_id) {
		canteen = canteenDict[canteen_id];
	}

	const setCanteen = (canteen: Canteens | null) => {
		if(canteen) {
			profile.canteen = canteen.id;
		} else {
			profile.canteen = null;
		}
		return setProfile(profile);
	}
	return [canteen, setCanteen];
}

export function useAccountBalance(): [number | null | undefined, ((newValue: number | null | undefined) => void)] {
	const [profile, setProfile] = useSynchedProfile();
	const setAccountBalance = (newValue: number | null | undefined) => {
		profile.credit_balance = newValue;
		return setProfile(profile);
	}
	return [profile?.credit_balance, setAccountBalance];
}

export function useIsProfileSetupComplete(): boolean {
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen(); // We do not need a canteen to be set
	// we should check if the user is first time user and has not set any data

	const requiredSetVariables: any[] = []
	for (let i=0; i<requiredSetVariables.length; i++) {
		const requiredVariable = requiredSetVariables[i];
		if (!requiredVariable) {
			return false;
		}
	}

	return true;
}

export function useSynchedProfileMarkingsDict(): [Record<string, ProfilesMarkings>, (marking: Markings, dislikes: boolean) => void, (marking: Markings) => void] {
	const [profile, setProfile] = useSynchedProfile();
	const profileMarkingsList: ProfilesMarkings[] = profile?.markings || [];
	const profilesMarkingsDict: Record<string, ProfilesMarkings> = {};
	for (let i=0; i<profileMarkingsList.length; i++) {
		const profilesMarking = profileMarkingsList[i];
		const markings_key = profilesMarking.markings_id;
		if (!!markings_key && typeof profilesMarking.markings_id === 'string') {
			profilesMarkingsDict[profilesMarking.markings_id] = profilesMarking;
		}
	}

	const privateSetMarkings = async (marking: Markings, dislikes: boolean, remove: boolean) => {
		//const markingsDictCopy = JSON.parse(JSON.stringify(profilesMarkingsDict));
		const markingsDictCopy = profilesMarkingsDict;

		const newProfileMarking: Partial<ProfilesMarkings> = {
			markings_id: marking.id,
			profiles_id: profile?.id,
			dislikes: dislikes
		};
		markingsDictCopy[marking.id] = newProfileMarking;

		if (remove) {
			delete markingsDictCopy[marking.id];
		}

		const markingsIds = Object.keys(markingsDictCopy);
		const newMarkings: ProfilesMarkings[] = [];
		for (const markingId of markingsIds) {
			newMarkings.push(markingsDictCopy[markingId]);
		}

		profile.markings = newMarkings;
		setProfile(profile);
	}

	const setProfileMarking = (marking: Markings, dislikes: boolean) => {
		privateSetMarkings(marking, dislikes, false);
	}

	const removeProfileMarking = (marking: Markings) => {
		privateSetMarkings(marking, false, true);
	}


	return [profilesMarkingsDict, setProfileMarking, removeProfileMarking];
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