import {useMyDrawerWikiItems} from "@/components/drawer/useMyDrawerWikiItems";
import {filterAndSortForVisibleInDrawerBottom, getBottomLegalRequiredLinks} from "@/components/drawer/MyDrawerItems";
import {View, Text} from "@/components/Themed";

export const PublicLegalRequiredLinks = (props: any) => {
	const customDrawerWikiItems = useMyDrawerWikiItems()
	const sortedCustomDrawerItems = filterAndSortForVisibleInDrawerBottom(customDrawerWikiItems)
	return getBottomLegalRequiredLinks(sortedCustomDrawerItems);
}
