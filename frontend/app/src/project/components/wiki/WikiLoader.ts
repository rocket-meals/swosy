import {CustomDirectusTypes} from "../../directusTypes/types";
import {PartialItem, TypeOf} from "@directus/sdk";

export class WikiLoader {

	static getWikisMenuItems(wikiDict): PartialItem<TypeOf<CustomDirectusTypes, any>>[]{
		let parents = WikiLoader.getParents(wikiDict);
		let wikiMenus = [];
		for(let parent of parents){
			wikiMenus.push(WikiLoader.replaceChildIdsWithChildren(parent, wikiDict, undefined))
		}
		return wikiMenus;
	}

	static replaceChildIdsWithChildren(wiki, wikiDict, loopTracker?){
		let childrenIds = wiki?.children || [];
		if(!loopTracker){
			loopTracker = {};
		}
		let children = [];
		for(let child of childrenIds){
			 let typeOfChild = typeof child;
			 let childId = typeOfChild === "number" ? child : child?.id;

			if(!loopTracker[childId]){
				loopTracker[childId] = true;
				let childWiki = wikiDict[childId];
				childWiki = WikiLoader.replaceChildIdsWithChildren(childWiki, wikiDict, loopTracker);
				children.push(childWiki);
			}
		}
		wiki.children = children;
		return wiki;
	}

	static getParents(wikiDict){
		let parents = [];
		let wikiIds = Object.keys(wikiDict);
		for(let wikiId of wikiIds){
			let wiki = wikiDict[wikiId];
			if(wiki?.parent === null && !wiki?.hideAsNormalWiki){
				parents.push(wiki);
			}
		}
		return parents;
	}

}
