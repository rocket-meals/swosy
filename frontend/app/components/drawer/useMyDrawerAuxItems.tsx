import {useMyDrawerWikiItems, useRenderedMyDrawerWikiScreens} from "@/components/drawer/useMyDrawerWikiItems";
import {MyDrawerCustomItemProps} from "@/components/drawer/MyDrawerCustomItemCenter";
import {
	renderMyDrawerScreen,
	useDrawerActiveBackgroundColor,
	useRenderMyDrawerScreen
} from "@/components/drawer/MyDrawer";
import {PlatformHelper} from "@/helper/PlatformHelper";

export function useRenderedMyDrawerAuxScreens() {
	const renderedMyDrawerWikiItems = useRenderedMyDrawerWikiScreens()
	const drawerActiveBackgroundColor = useDrawerActiveBackgroundColor()

	const renderedMyDrawerAuxScreens: React.ReactNode[] = []
	renderedMyDrawerAuxScreens.push(...renderedMyDrawerWikiItems)

	renderedMyDrawerAuxScreens.push(
		renderMyDrawerScreen({
				routeName: 'download-app/index',
				label: 'Download App',
				title: 'Download App',
				icon: 'home',
				visibleInDrawer: true,
				getHeader: null,
				hideDrawer: true
			}, drawerActiveBackgroundColor)
	)

	return renderedMyDrawerAuxScreens;
}

export function useMyDrawerAuxItems(){
	const customDrawerWikiItems = useMyDrawerWikiItems()

	const customDrawerItems: MyDrawerCustomItemProps[] = []
	customDrawerItems.push(...customDrawerWikiItems)

	return customDrawerItems;
}