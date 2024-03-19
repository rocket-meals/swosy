import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Foods, FoodsMarkings} from '@/helper/database/databaseTypes/types';
import {useSynchedResourceRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {getDemoMarkings} from "@/states/SynchedMarkings";

export function useSynchedFoods(): [(Record<string, Foods> | undefined), ((newValue: Record<string, Foods>, timestampe?: number) => void), (number | undefined)] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Foods>(PersistentStore.foods);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoFoods()
	}
	return [usedResources, setResourcesOnly, lastUpdate]
}

export function getDemoFoods(): Record<string, Foods> {
	const demoNames = ['Fries', 'Burger', 'Lasagne', 'Pizza', 'Pasta', 'Salad', 'Soup', 'Sushi', 'Steak', 'Chicken', 'Fish', 'Rice', 'Noodles', 'Dumplings', 'Curry', 'Tacos', 'Burritos', 'Sandwich', 'Hotdog', 'Kebab', 'Doner', 'Falafel', 'Shawarma']
	const demoResources: Record<string, Foods> = {}
	demoNames.forEach((name, index) => {
		const demoResource: Foods = getDemoResource(index, index.toString(), 'Demo '+name+' '+index.toString())
		demoResources[demoResource.id] = demoResource
	})

	return demoResources
}

function getDemoResource(index: number, id: string, name: string): Foods {
	let languages = getDemoLanguagesDict();

	let translations = []
	for (let languageKey in languages) {
		let language = languages[languageKey]
		translations.push({
			name: language.code+" - "+name,
			id: id,
			foods_id: id,
			languages_code: language.code
		})
	}

	let all_markings = getDemoMarkings();
	let marking_ids = Object.keys(all_markings);
	// select 5 markings by the position of index, skip dublicates
	let selected_marking_ids = marking_ids.slice(index*5, index*5+5);

	let food_markings: FoodsMarkings[] = [];
	for(let marking_id of selected_marking_ids){
		food_markings.push({
			foods_id: id,
			id: index,
			markings_id: marking_id
		})
	}

	return (
		{
			date_created: new Date().toISOString(),
			date_updated: new Date().toISOString(),
			id: id,
			alias: name,
			image: undefined,
			sort: undefined,
			markings: food_markings,
			status: '',
			user_created: undefined,
			user_updated: undefined,
			translations: translations,
		}
	)
}