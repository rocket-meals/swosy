import {MyGlobalActionSheetConfig, RenderCustomContent} from "@/components/actionsheet/MyGlobalActionSheet";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MyButton} from "@/components/buttons/MyButton";
import {IconNames} from "@/constants/IconNames";
import {View} from "@/components/Themed";

export type MyActionSheetConfirmerProps = {
	renderPreItemsContent?: RenderCustomContent
	renderPostItemsContent?: RenderCustomContent,
	confirmLabel?: string
	cancelLabel?: string
	onCancel?: () => Promise<boolean>
	onConfirm: () => Promise<boolean>
}
export const useMyActionSheetConfigConfirmer = (props: MyActionSheetConfirmerProps): MyGlobalActionSheetConfig => {

	const translation_attention = useTranslation(TranslationKeys.attention);
	const translation_confirm = useTranslation(TranslationKeys.confirm);
	const translation_cancel = useTranslation(TranslationKeys.cancel);

	const config: MyGlobalActionSheetConfig = {
		visible: true,
		title: translation_attention,
		renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
			let items = []

			const usedConfirmLabel = props.confirmLabel || translation_confirm
			items.push(<MyButton useOnlyNecessarySpace={true} leftIcon={IconNames.confirm_icon} accessibilityLabel={usedConfirmLabel} tooltip={usedConfirmLabel} text={usedConfirmLabel} onPress={async () => {
				const result = await props.onConfirm()
				if(result!==false){
					hide()
				}
			} } />)

			const onCancel = props.onCancel
			if(onCancel){
				const usedCancelLabel = props.cancelLabel || translation_cancel
				items.push(<View style={{width: 10}} />)
				items.push(<MyButton useOnlyNecessarySpace={true} leftIcon={IconNames.cancel_icon} accessibilityLabel={usedCancelLabel} tooltip={usedCancelLabel} text={usedCancelLabel} onPress={async () => {
					hide()
				} } />)
			}

			let preRenderedContent = undefined
			if(props.renderPreItemsContent){
				preRenderedContent = props.renderPreItemsContent(backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide)
			}

			let postRenderedContent = undefined
			if(props.renderPostItemsContent){
				postRenderedContent = props.renderPostItemsContent(backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide)
			}

			return <View style={{
				width: "100%",
			}}>
				{preRenderedContent}
				<View style={{
					width: "100%",
					flexDirection: "row",
					// align items on the right
					justifyContent: "flex-end",
				}}>
					{items}
				</View>
				{postRenderedContent}
			</View>

		}
	}
	return config
}