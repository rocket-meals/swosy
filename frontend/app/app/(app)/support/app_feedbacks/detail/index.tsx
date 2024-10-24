import {MySafeAreaView} from '@/components/MySafeAreaView';
import {router, useGlobalSearchParams, useLocalSearchParams} from 'expo-router';
import React, {useEffect} from 'react';
import {AppFeedbacks} from "@/helper/database/databaseTypes/types";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {SettingsRowTextEdit} from "@/components/settings/SettingsRowTextEdit";
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {IconNames} from "@/constants/IconNames";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {MyButton} from "@/components/buttons/MyButton";
import {View, Text, Heading, TEXT_SIZE_SMALL} from "@/components/Themed";
import {getDeviceInformationWithoutPushToken} from "@/helper/device/DeviceHelper";
import {useSynchedProfileId} from "@/states/SynchedProfile";
import {SETTINGS_ROW_DEFAULT_PADDING, SettingsRow} from "@/components/settings/SettingsRow";
import {SettingsRowNumberEdit} from "@/components/settings/SettingsRowNumberEdit";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {SettingsRowTextAreaEdit} from "@/components/settings/SettingsRowTextAreaEdit";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {useMyModalConfirmer} from "@/components/modal/MyModalConfirmer";
import {TABLE_NAME_APP_FEEDBACKS} from "@/app/(app)/support";
import {SettingsRowTriStateLikeDislike} from "@/components/settings/SettingsRowTriStateLikeDislike";
import {PermissionActions, PermissionHelper, PermissionHelperObject} from "@/helper/permission/PermissionHelper";
import {DateHelper} from "@/helper/date/DateHelper";
import useMyToast from "@/components/toast/MyToast";

export const SEARCH_PARAM_APPFEEDBACK_ID = 'app_feedbacks_id';

export const getRouteForAppfeedbackDetails = (appfeedback_id?: string) => {
	let route = "(app)/support/app_feedbacks/detail";
	if(appfeedback_id){
		route += "?"+SEARCH_PARAM_APPFEEDBACK_ID+"="+appfeedback_id;
	}
	return route;
}

export function useAppfeedbackIdFromLocalSearchParams() {
	const params = useGlobalSearchParams<{ [SEARCH_PARAM_APPFEEDBACK_ID]?: string }>();
	return params[SEARCH_PARAM_APPFEEDBACK_ID];
}

const APP_FEEDBACK_FIELDS_LIST = [
	"id",
	"title",
	"content",
	"contact_email",
	"device_brand",
	"positive",
	"device_system_version",
	"device_platform",
	"display_height",
	"display_width",
	"display_fontscale",
	"display_pixelratio",
	"display_scale"
] as const;

export default function AppfeedbackDetails() {
	const param_appfeedback_id = useAppfeedbackIdFromLocalSearchParams();
	const profile_id = useSynchedProfileId();
	const myToast = useMyToast();

	const permissionHelperObject: PermissionHelperObject = PermissionHelper.usePermissionHelperObject();
	console.log(permissionHelperObject)

	const collectionHelper = new CollectionHelper<AppFeedbacks>(TABLE_NAME_APP_FEEDBACKS)

	const translation_title = useTranslation(TranslationKeys.title)
	const translation_email = useTranslation(TranslationKeys.email)
	const translation_optional = useTranslation(TranslationKeys.optional)
	const translation_feedback = useTranslation(TranslationKeys.feedback)
	const translation_unknown = useTranslation(TranslationKeys.unknown)
	const translation_content = useTranslation(TranslationKeys.feedback);
	const translation_is_loading = useTranslation(TranslationKeys.is_loading)
	const translation_success = useTranslation(TranslationKeys.success)
	const translation_error = useTranslation(TranslationKeys.error)
	const translation_like_status = useTranslation(TranslationKeys.like_status)

	const translation_date_created = useTranslation(TranslationKeys.date_created)
	const translation_date_updated = useTranslation(TranslationKeys.date_updated)

	const translation_response = useTranslation(TranslationKeys.response)
	const translation_support_team = useTranslation(TranslationKeys.support_team)
	const translation_your_request = useTranslation(TranslationKeys.your_request)

	const translation_support_warning_no_account_or_mail_provided_therefore_we_cannot_answer_your_request = useTranslation(TranslationKeys.support_warning_no_account_or_mail_provided_therefore_we_cannot_answer_your_request)

	const translation_delete = useTranslation(TranslationKeys.delete)

	const translation_to_update = useTranslation(TranslationKeys.to_update)
	const translation_send = useTranslation(TranslationKeys.send)
	const deviceInformation = getDeviceInformationWithoutPushToken();

	const [creatingOrUpdating, setCreatingOrUpdating] = React.useState(false);


	const unfilteredInitialAppfeedbackOnCreation: Partial<AppFeedbacks> = {
		id: param_appfeedback_id,
		device_brand: deviceInformation.brand,
		positive: undefined,
		device_system_version: deviceInformation.system_version,
		device_platform: deviceInformation.platform,
		display_height: deviceInformation.display_height,
		display_width: deviceInformation.display_width,
		display_fontscale: deviceInformation.display_fontscale,
		display_pixelratio: deviceInformation.display_pixelratio,
		display_scale: deviceInformation.display_scale,
	}
	if(!!profile_id){
		unfilteredInitialAppfeedbackOnCreation.profile = profile_id;
	}

	const [appfeedback, setAppfeedback] = React.useState<Partial<AppFeedbacks>>(unfilteredInitialAppfeedbackOnCreation);

	const profileOrEmailProvided = !!profile_id || !!appfeedback?.contact_email;
	const profileOrEmailMissing = !profileOrEmailProvided;

	let renderProfileOrEmailMissingWarning = null;
	if(profileOrEmailMissing){
		renderProfileOrEmailMissingWarning = <SettingsRowGroup>
			<View style={{
				paddingHorizontal: SETTINGS_ROW_DEFAULT_PADDING
			}}>
				<Text size={TEXT_SIZE_SMALL} style={{

				}}>
					{translation_support_warning_no_account_or_mail_provided_therefore_we_cannot_answer_your_request}
				</Text>
			</View>
		</SettingsRowGroup>
	}

	let create_new = !appfeedback?.id;
	const permissionAction: PermissionActions = create_new ? PermissionActions.CREATE : PermissionActions.UPDATE;

	let permissions_for_resource = getAllowedFieldsToChange(permissionAction);


	function getAllowedFieldsToChange(permissionAction: PermissionActions) {
		const permission_map: { [key in typeof APP_FEEDBACK_FIELDS_LIST[number]]: boolean } = {} as any;

		for (const field of APP_FEEDBACK_FIELDS_LIST) {
			permission_map[field] = PermissionHelper.isFieldAllowedForAction(permissionHelperObject, TABLE_NAME_APP_FEEDBACKS, field, permissionAction);
		}

		return permission_map;
	}

	async function loadAppfeedback() {
		if(!!param_appfeedback_id) {
			let feedbacks_remote = await collectionHelper.readItem(param_appfeedback_id);
			setAppfeedback(feedbacks_remote);
		}
	}

	useEffect(() => {
		loadAppfeedback();
	}, [param_appfeedback_id]);

	// when state of createOrUpdating changes
	useEffect(() => {
		async function createOrUpdateAppfeedback() {
			if(creatingOrUpdating) {
				console.log("createOrUpdateAppfeedback", appfeedback)
				try{
					if(create_new) {
						let filteredItemForCreate = PermissionHelper.filterItemForAllowedCreateFields<AppFeedbacks>(permissionHelperObject, TABLE_NAME_APP_FEEDBACKS, appfeedback)
						let newItem = await collectionHelper.createItem(filteredItemForCreate);
						console.log("newItem", newItem)
						myToast.show(translation_success);
						if(newItem?.id){
							router.push("(app)/support/app_feedbacks");
						} else {
							setAppfeedback(newItem);
							setCreatingOrUpdating(false);
						}
					} else if(appfeedback?.id) {
						let filteredItemForUpdate = PermissionHelper.filterItemForAllowedUpdateFields<AppFeedbacks>(permissionHelperObject, TABLE_NAME_APP_FEEDBACKS, appfeedback);
						console.log("filteredItemForUpdate", filteredItemForUpdate)
						let updatedItem = await collectionHelper.updateItem(appfeedback?.id, filteredItemForUpdate);
						console.log("updatedItem", updatedItem)
						myToast.show(translation_success);
						loadAppfeedback();
					}
				} catch (e) {
					myToast.show(translation_error);
					console.error(e);
				}
				setCreatingOrUpdating(false);
			}
		}
		createOrUpdateAppfeedback();
	}, [creatingOrUpdating]);

	async function onEditField(field: string, nextValue: string | number | null | undefined) {
		let new_appfeedback = {...appfeedback || {}, [field]: nextValue};
		if(nextValue === null || nextValue === undefined){
			// @ts-ignore
			delete new_appfeedback[field];
		}
		setAppfeedback(new_appfeedback);
	}

	function getOnEditSpecialTextField(field: string) {
		return async function(nextValue: string | null | undefined) {
			await onEditField(field, nextValue);
		}
	}

	function getOnEditSpecialNumberField(field: string) {
		return async function(nextValue: number | null | undefined) {
			let nextValueFormatted: any = nextValue;
			if(nextValue !== null && nextValue !== undefined){
				nextValueFormatted = nextValue.toString();
			}
			await onEditField(field, nextValueFormatted);
		}
	}

	async function onEditEmail(nextValue: string | null | undefined) {
		if(!!nextValue && nextValue.length > 0){
			let validEmail = nextValue && nextValue.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
			if(!validEmail) {
				return;
			}
		}
		await onEditField('contact_email', nextValue);
	}

	let renderedDateCreated: any = null;
	if(appfeedback?.date_created){
		renderedDateCreated = <SettingsRow labelLeft={translation_date_created} accessibilityLabel={translation_date_created} labelRight={DateHelper.formatOfferDateToReadable(new Date(appfeedback?.date_created), true ,true)} />
	}
	let renderedDateUpdated: any = null;
	if(appfeedback?.date_updated){
		renderedDateUpdated = <SettingsRow labelLeft={translation_date_updated} accessibilityLabel={translation_date_updated} labelRight={appfeedback?.date_updated} />
	}

	let renderedId: any = <SettingsRowGroup>
		<SettingsRow labelLeft={"ID"} accessibilityLabel={"ID"} labelRight={param_appfeedback_id} />
		{renderedDateCreated}
		{renderedDateUpdated}
	</SettingsRowGroup>
	if(!param_appfeedback_id){
		renderedId = null;
	}

	let renderedProfileId: any = <SettingsRowGroup>
		<SettingsRow labelLeft={"Profile ID"} accessibilityLabel={"Profile ID"} labelRight={appfeedback?.profile+""} />
	</SettingsRowGroup>
	if(!appfeedback?.profile){
		renderedProfileId = null;
	}

	let renderedResponse: any = null;
	if(appfeedback?.response){
		renderedResponse = <SettingsRowGroup>

			<View style={{
				width: "100%",
				paddingHorizontal: 20,
			}}>
				<Heading>
					{translation_response+": "+translation_support_team}
				</Heading>
				<ThemedMarkdown markdown={appfeedback?.response} />
			</View>
		</SettingsRowGroup>
	}

	async function handleDelete() {
		if(param_appfeedback_id) {
			await collectionHelper.deleteItem(param_appfeedback_id);
			router.push("(app)/support");
		}
	}

	const askForDeleteConfirmation = useMyModalConfirmer({
		onConfirm: handleDelete,
		confirmLabel: translation_delete,
	})

	let renderedDeleteButton: any = <SettingsRowGroup>
		<SettingsRow leftIcon={IconNames.delete_icon} labelLeft={translation_delete} accessibilityLabel={translation_delete} onPress={() => {
			askForDeleteConfirmation();
		}} />
	</SettingsRowGroup>
	if(!param_appfeedback_id){
		renderedDeleteButton = null;
	}


	let createOrSaveButtonEnabled = !!appfeedback?.title && !!appfeedback?.content
	let createOrSaveButtonLabel = create_new ? translation_send : translation_to_update;
	let createOrSaveButtonIcon = create_new ? IconNames.create_icon : IconNames.save_icon;
	let createOrSaveButtonAccessibilityLabel = translation_feedback+": "+createOrSaveButtonLabel;
	if(creatingOrUpdating){
		createOrSaveButtonEnabled = false;
		createOrSaveButtonLabel = translation_is_loading;
		createOrSaveButtonAccessibilityLabel = translation_is_loading;
	}


	let renderedCreateOrSaveButton = <SettingsRowGroup>
		<View style={{
			width: "100%",
			paddingHorizontal: 20,
		}}>
			<MyButton disabled={!createOrSaveButtonEnabled} isActive={createOrSaveButtonEnabled}
					  rightIcon={createOrSaveButtonIcon} accessibilityLabel={createOrSaveButtonAccessibilityLabel}
					  text={createOrSaveButtonLabel}
					  onPress={async () => {
						setCreatingOrUpdating(true);
					  }}
			/>
		</View>
	</SettingsRowGroup>

	return (
		<MySafeAreaView>
			<MyScrollView>
				{renderedResponse}
				<SettingsRowGroup>
					<View style={{
						width: "100%",
						paddingHorizontal: 20,
					}}>
						<Heading>
							{translation_your_request}
						</Heading>
					</View>
					<SettingsRowTextEdit disabled={!permissions_for_resource.title} onSave={getOnEditSpecialTextField("title")} labelLeft={translation_title} accessibilityLabel={translation_title} labelRight={appfeedback?.title} leftIcon={IconNames.title_icon} />
					<SettingsRowTextAreaEdit disabled={!permissions_for_resource.content} onSave={getOnEditSpecialTextField("content")} labelLeft={translation_content} accessibilityLabel={translation_content} labelRight={appfeedback?.content} leftIcon={IconNames.content_icon} />
					<SettingsRowTextEdit disabled={!permissions_for_resource.contact_email} onSave={onEditEmail} labelLeft={translation_email+" ("+translation_optional+")"} accessibilityLabel={translation_email} labelRight={appfeedback?.contact_email} leftIcon={IconNames.mail_icon} />
					<SettingsRowTriStateLikeDislike disabled={!permissions_for_resource.positive} value={appfeedback.positive} accessibilityLabel={translation_like_status} labelLeft={translation_like_status} leftIcon={IconNames.like_active_icon} onSetState={(like: boolean | undefined) => {
						console.log("nextValue boolean", like)
						let new_appfeedback = {...appfeedback || {}, positive: like};
						setAppfeedback(new_appfeedback)
					}} />
				</SettingsRowGroup>
				{renderProfileOrEmailMissingWarning}
				{renderedCreateOrSaveButton}
				{renderedDeleteButton}
				{renderedProfileId}
				<SettingsRowGroup>
					<SettingsRowTextEdit disabled={!permissions_for_resource.device_brand} labelLeft={"Device Brand"} accessibilityLabel={"Device Brand"} labelRight={appfeedback?.device_brand || translation_unknown} onSave={getOnEditSpecialTextField("device_brand")} />
					<SettingsRowTextEdit disabled={!permissions_for_resource.device_system_version} labelLeft={"Device System Version"} accessibilityLabel={"Device System Version"} labelRight={appfeedback?.device_system_version || translation_unknown} onSave={getOnEditSpecialTextField("device_system_version")} />
					<SettingsRowTextEdit disabled={!permissions_for_resource.device_platform} labelLeft={"Device Platform"} accessibilityLabel={"Device Platform"} labelRight={appfeedback?.device_platform || translation_unknown} onSave={getOnEditSpecialTextField("device_platform")} />
					<SettingsRowNumberEdit disabled={!permissions_for_resource.display_height} labelLeft={"Display Height"} accessibilityLabel={"Display Height"} labelRight={appfeedback?.display_height+"px"} onSave={getOnEditSpecialNumberField("display_height")} />
					<SettingsRowNumberEdit disabled={!permissions_for_resource.display_width} labelLeft={"Display Width"} accessibilityLabel={"Display Width"} labelRight={appfeedback?.display_width+"px"} onSave={getOnEditSpecialNumberField("display_width")} />
					<SettingsRowNumberEdit disabled={!permissions_for_resource.display_fontscale} labelLeft={"Display Fontscale"} accessibilityLabel={"Display Fontscale"} labelRight={"x"+appfeedback?.display_fontscale+""} onSave={getOnEditSpecialNumberField("display_fontscale")} />
					<SettingsRowNumberEdit disabled={!permissions_for_resource.display_pixelratio} labelLeft={"Display Pixelratio"} accessibilityLabel={"Display Pixelratio"} labelRight={"x"+appfeedback?.display_pixelratio+""} onSave={getOnEditSpecialNumberField("display_pixelratio")} />
					<SettingsRowNumberEdit disabled={!permissions_for_resource.display_scale} labelLeft={"Display Scale"} accessibilityLabel={"Display Scale"} labelRight={"x"+appfeedback?.display_scale+""} onSave={getOnEditSpecialNumberField("display_scale")} />
				</SettingsRowGroup>
				{renderedId}
			</MyScrollView>
		</MySafeAreaView>
	)
}