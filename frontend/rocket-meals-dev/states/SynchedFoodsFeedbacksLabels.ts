import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {FoodsFeedbacksLabels} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {MaterialIcons} from "@expo/vector-icons";

async function loadResourcesFromServer(): Promise<FoodsFeedbacksLabels[]> {
	const collectionHelper = new CollectionHelper<FoodsFeedbacksLabels>('foods_feedbacks_labels');

	const fields = ['*','translations.*'];

	const query = {
		limit: -1,
		fields: fields
	}

	return await collectionHelper.readItems(query);
}

export function useSynchedFoodsFeedbacksLabelsDict(): [( Record<string, FoodsFeedbacksLabels | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, FoodsFeedbacksLabels | null | undefined> | null | undefined)) => Record<string, FoodsFeedbacksLabels | null | undefined>, timestamp?: (number | undefined)) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<FoodsFeedbacksLabels>(PersistentStore.foodsFeedbacksLabels);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoFoodsFeedbacksLabelsDict()
	}

	async function updateFromServer(nowInMs?: number) {
		const resourceAsList = await loadResourcesFromServer();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'id')
		setResourcesOnly((currentValue) => {
			return resourceAsDict
		}, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

function getDemoResource(index: number, nameOfLabel: string, icon: string): FoodsFeedbacksLabels {
	let languages = getDemoLanguagesDict();

	const name = 'Demo '+nameOfLabel

	let translations = []
	for (let languageKey in languages) {
		let language = languages[languageKey]
		translations.push({
			text: language.code+" - "+name,
			id: index,
			content: language.code,
			foods_feedbacks_labels_id: index+"",
			languages_code: language.code
		})
	}

	return {
		alias: name,
		id: index+'',
		status: '',
		visible: true,
		translations: translations,
		icon: icon
	}
}

export function getDemoFoodsFeedbacksLabelsDict(): Record<string, FoodsFeedbacksLabels> {
	const demoResources: Record<string, FoodsFeedbacksLabels> = {}

	let names = ["Zu salzig", "Zu viel", "Lecker", "Herzhaft", "Süß", "Sauer", "Bitter", "Umami", "Fettig", "Trocken"]
	let icons = ["water", "check", "close", "book", "pause", "mail"]

	for (let i = 0; i < names.length; i++) {
		let name = names[i];
		let icon = icons[i%icons.length];
		const demoResource = getDemoResource(i, name, icon)
		demoResources[demoResource.id] = demoResource
	}

	return demoResources
}