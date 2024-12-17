import {useMyDrawerWikiItems, useRenderedMyDrawerWikiScreens} from "@/components/drawer/useMyDrawerWikiItems";
import {MyDrawerCustomItemProps} from "@/components/drawer/MyDrawerCustomItemCenter";
import {
	renderMyDrawerScreen,
	useDrawerActiveBackgroundColor,
	useRenderMyDrawerScreen
} from "@/components/drawer/MyDrawer";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {IconNames} from "@/constants/IconNames";
import {useTranslationAccountDelete} from "@/compositions/settings/SettingsRowUserDelete";

export function useRenderedMyDrawerAuxScreens() {
	const renderedMyDrawerWikiItems = useRenderedMyDrawerWikiScreens()
	const drawerActiveBackgroundColor = useDrawerActiveBackgroundColor()
	const translation_delete_account = useTranslationAccountDelete();

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

	renderedMyDrawerAuxScreens.push(
		renderMyDrawerScreen({
			routeName: 'delete-user/index',
			label: translation_delete_account,
			title: translation_delete_account,
			icon: IconNames.user_account_delete_icon,
			showBackButton: true,
			visibleInDrawer: false
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