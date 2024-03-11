import {PersistentStore} from '@/helper/syncState/PersistentStore';
import { Foods} from '@/helper/database/databaseTypes/types';
import {useSynchedResourceRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';

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
		const demoResource: Foods = getDemoResource(index.toString(), 'Demo '+name+' '+index.toString())
		demoResources[demoResource.id] = demoResource
	})

	return demoResources
}

function getDemoResource(id: string, name: string): Foods {
	return (
		{
			date_created: new Date().toISOString(),
			date_updated: new Date().toISOString(),
			id: id,
			alias: name,
			image: undefined,
			sort: undefined,
			status: '',
			user_created: undefined,
			user_updated: undefined,
			canteen: undefined,
			price: undefined,
			food_category: undefined,
			food_category_id: undefined
		}
	)
}