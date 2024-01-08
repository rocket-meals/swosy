// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";
import {AlertDialog, Button, Heading, Modal, Text, View} from "native-base";
import {ConfigHolder} from "../../ConfigHolder";
import {DetailsComponentMenus, DetailsComponentMenuType} from "../../components/DetailsComponentMenus";
import {TranslationKeys} from "../../translations/TranslationKeys";
import {RequiredSynchedStates} from "../../synchedstate/RequiredSynchedStates";
import {useSynchedCookieConfig, useSynchedJSONState} from "../../synchedstate/SynchedState";
import {Layout} from "../../templates/Layout";
import {useProjectColor} from "../../templates/useProjectColor";
import {useDefaultButtonColor} from "../../theme/useDefaultButtonColor";
import {SettingsRowBooleanSwitch} from "../../components/settings/SettingsRowBooleanSwitch";
import {LegalRequiredLinks} from "../legalRequirements/LegalRequiredLinks";
import {ScrollViewWithGradient} from "../../utils/ScrollViewWithGradient";
import {SettingsSpacer} from "../../components/settings/SettingsSpacer";
import {useBackgroundColor} from "../../templates/useBackgroundColor";
import {ProjectLogo} from "../../project/ProjectLogo";
import {DateHelper} from "../../helper/DateHelper";
import {KitchenSafeAreaView} from "../../components/KitchenSafeAreaView";
import {
  CookieDetails,
  CookieGroupEnum,
  CookieHelper,
  getAcceptAllCookieConfig,
  getDefaultCookieConfig
} from "./CookieHelper";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {MyTouchableOpacity} from "../../components/buttons/MyTouchableOpacity";
import {Linking} from "react-native";
import {MyThemedBox} from "../../helper/MyThemedBox";
import {useMyContrastColor} from "../../theme/useMyContrastColor";
import {AccessibilityRoles} from "../../helper/AccessibilityRoles";

interface AppState {
  autoOpenCookies?: boolean;
}
export const CookieInformationInner: FunctionComponent<AppState> = ({autoOpenCookies, ...props}) => {

  if(!ConfigHolder.useCookiePolicy){
    return null;
  }

  const menu_key_cookie_consent = "cookieConsent";
  const menu_key_cookie_details = "cookieDetails";
  const menu_key_cookie_about = "cookieAbout";
  const backgroundColor = useBackgroundColor();

  const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
  let project_color = useProjectColor()
  const project_color_contrast_color = useMyContrastColor(project_color);

  const defaultButtonColor = useDefaultButtonColor();
  const defaultButtonContrastColor = useMyContrastColor(defaultButtonColor);

  const width = Layout.useBaseTemplateContentWidth()

  const [cookieConfig, setCookieConfig] = useSynchedCookieConfig();
  let [tempCookieConfig, setTempCookieConfig] = useState(cookieConfig);

  const date_consent = cookieConfig?.date_consent;
  const date_consent_human_readable = getHumanReadableDate(date_consent);
  const date_cookie_policy_updated = undefined;
  const date_cookie_policy_updated_human_readable = getHumanReadableDate(date_cookie_policy_updated);

  function getHumanReadableDate(date: string | undefined): string {
    if (!date) {
      return "/";
    }
    return DateHelper.formatDateToReadable(new Date(date), true, true);
  }

  const translation_cookies = useTranslation(TranslationKeys.cookies);
  const translation_cookie_policy_consent = useTranslation(TranslationKeys.cookie_policy_consent)
  const translation_cookie_policy_details = useTranslation(TranslationKeys.cookie_policy_details)
  const translation_cookie_policy_about = useTranslation(TranslationKeys.cookie_policy_about)

  const translation_cookie_policy_button_accept_all = useTranslation(TranslationKeys.cookie_policy_button_accept_all)
  const translation_cookie_policy_button_deny_all = useTranslation(TranslationKeys.cookie_policy_button_deny_all)
  const translation_cookie_policy_button_allow_selected = useTranslation(TranslationKeys.cookie_policy_button_allow_selected)

  const translation_cookie_policy_details_name = useTranslation(TranslationKeys.cookie_policy_details_name)
  const translation_cookie_policy_details_purpose = useTranslation(TranslationKeys.cookie_policy_details_purpose)
  const translation_cookie_policy_details_type = useTranslation(TranslationKeys.cookie_policy_details_type)
  const translation_cookie_policy_details_expiry = useTranslation(TranslationKeys.cookie_policy_details_expiry)
  const translation_cookie_policy_details_provider = useTranslation(TranslationKeys.cookie_policy_details_provider)

  const translation_cookie_policy_consent_date = useTranslation(TranslationKeys.cookie_policy_consent_date)
  const translation_cookie_policy_policy_date_updated = useTranslation(TranslationKeys.cookie_policy_policy_date_updated)

  const translation_save_current_selection = translation_cookie_policy_button_allow_selected;

  const [default_menu_key, setDefaultMenuKey] = useState(menu_key_cookie_consent);

  let [isOpen, setIsOpen] = useSynchedJSONState(RequiredSynchedStates.showCookies)

  function getMenu(translation_text, element): DetailsComponentMenuType {
    return {
      element: element,
      menuButtonText: translation_text,
      onPress: (menuKey) => {
        setDefaultMenuKey(menuKey)
      }
    }
  }

  const menu_consent: DetailsComponentMenuType = getMenu(translation_cookie_policy_consent, renderCookiesConsent());
  const menu_details: DetailsComponentMenuType = getMenu(translation_cookie_policy_details, renderCookieDetails());
  const menu_about: DetailsComponentMenuType = getMenu(translation_cookie_policy_about, renderCookiesAbout());


  const menus: Record<string, DetailsComponentMenuType> = {
    [menu_key_cookie_consent]: menu_consent,
    [menu_key_cookie_details]: menu_details,
    [menu_key_cookie_about]: menu_about
  }

  // corresponding componentDidMount
  useEffect(() => {

  }, [])

  function acceptCookiesSelected(){
    handleDecision(tempCookieConfig);
  }

  function denyCookiesAll(){
    tempCookieConfig = getDefaultCookieConfig();
    handleDecision({...tempCookieConfig});
  }

  function acceptCookiesAll(){
    tempCookieConfig = getAcceptAllCookieConfig();
    handleDecision({...tempCookieConfig});
  }

  function handleDecision(cookie_config){
    cookie_config.date_consent = new Date().getTime();
    setCookieConfig({...cookie_config});
    setTempCookieConfig({...cookie_config});
    // add a small delay to make sure the user sees the change
    setTimeout(() => {
      setIsOpen(false);
    } , 500);
  }

  function renderCookiesConsentScrollView(){
    return (
      <ScrollViewWithGradient>
        <View style={{
          flex: 1,
          width: "100%",
          alignItems: "center", justifyContent: "center",
          flexDirection: 'row',
          flexWrap: 'wrap', // Enable wrapping of items
        }}>
          <View style={{width: "100%"}}>
            {ConfigHolder.plugin.getCookieComponentConsent()}
          </View>
          <LegalRequiredLinks />
        </View>
      </ScrollViewWithGradient>
    )
  }

  function renderSwitchCookie(type: string, disabled: boolean = false){
    let translation_text = ConfigHolder.plugin.getCookieGroupName(type);

    return (
      <SettingsRowBooleanSwitch
        disabled={disabled}
        key={"renderSwitchCookie"+type+tempCookieConfig.consent[type]}
        value={tempCookieConfig.consent[type]} accessibilityLabel={translation_text}
        leftContent={<Text>{translation_text}</Text>}
        onValueChange={(value) => {
          tempCookieConfig.consent[type] = value;
          setTempCookieConfig({...tempCookieConfig});
        }} />
    )
  }

  function renderSwitchCookieForAdditionalGroups(){
    const additional_groups = ConfigHolder.plugin.getCookieAdditionalGroups()
    if(additional_groups.length===0){
      return null;
    } else {
      let output = [];
      for(let i=0; i<additional_groups.length; i++){
        let group = additional_groups[i];
        output.push(renderSwitchCookie(group, false));
      }
      return output;
    }
  }

  function renderPolicyUpdatedDate(){
    if(!date_cookie_policy_updated){
      return null;
    }

    return(
      <Text>{translation_cookie_policy_policy_date_updated+": "+date_cookie_policy_updated_human_readable}</Text>
    )
  }

  function renderCookiesConsent(){
      return (
        <View style={{width: "100%", flex: 1}}>
          <View style={{width: "100%", flex: 1}}>
            {renderCookiesConsentScrollView()}
          </View>
          <ScrollViewWithGradient>
            <View style={{
              flex: 1,
              width: "100%",
              alignItems: "center", justifyContent: "center",
              flexDirection: 'row',
              flexWrap: 'wrap', // Enable wrapping of items
            }}>
              <View style={{width: "100%"}}>
                <View style={{width: "100%"}}>
                  <SettingsSpacer />
                  {renderSwitchCookie(CookieGroupEnum.Necessary, true)}
                  {renderSwitchCookieForAdditionalGroups()}
                  <View style={{width: "100%"}}>
                    <Text>{translation_cookie_policy_consent_date+": "+date_consent_human_readable}</Text>
                    {renderPolicyUpdatedDate()}
                  </View>
                </View>
              </View>
            </View>
          </ScrollViewWithGradient>
        </View>
      )
  }

  function renderSpecificCookieDetailsTableHeader(){
    return(
      <View style={{width: "100%", flex: 1}}>
        <MyThemedBox _shadeLevel={2}>
          <View style={{width: "100%", flexDirection: "row", flex: 1}}>
            <View style={{flex: 2}}>
              <Text fontSize={"sm"}>{translation_cookie_policy_details_name}</Text>
            </View>
            <View style={{flex: 2}}>
              <Text fontSize={"sm"}>{translation_cookie_policy_details_provider}</Text>
            </View>
            <View style={{flex: 2}}>
              <Text fontSize={"sm"}>{translation_cookie_policy_details_purpose}</Text>
            </View>
            <View style={{flex: 1}}>
              <Text fontSize={"sm"}>{translation_cookie_policy_details_expiry}</Text>
            </View>
            <View style={{flex: 1}}>
              <Text fontSize={"sm"}>{translation_cookie_policy_details_type}</Text>
            </View>
          </View>
        </MyThemedBox>
        <SettingsSpacer />
      </View>
    )
  }

  function renderSpecificCookieDetails(specificCookieName: string, cookieDetails: CookieDetails){
    const providerLabel = cookieDetails?.provider || cookieDetails?.provider_url;
    let renderedProvider = <Text fontSize={"sm"}>{providerLabel}</Text>
    if(!!cookieDetails?.provider_url){
      renderedProvider = (
        <MyTouchableOpacity accessibilityRole={AccessibilityRoles.link} accessibilityLabel={cookieDetails?.provider_url} onPress={() => {
          Linking.openURL(cookieDetails?.provider_url);
        }}>
          {renderedProvider}
        </MyTouchableOpacity>
      )
    }

    return(
      <View style={{width: "100%", flex: 1}} key={"renderSpecificCookieDetails"+specificCookieName}>
        <View style={{width: "100%", flexDirection: "row", flex: 1}}>
          <View style={{flex: 2}}>
            <Text selectable={true} fontSize={"sm"}>{specificCookieName}</Text>
          </View>
          <View style={{flex: 2}}>
            {renderedProvider}
          </View>
          <View style={{flex: 2}}>
            <Text fontSize={"sm"}>{cookieDetails?.purpose}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text fontSize={"sm"}>{cookieDetails?.expiry}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text fontSize={"sm"}>{cookieDetails?.storageType}</Text>
          </View>
        </View>
        <SettingsSpacer />
      </View>
    )
  }

  function renderCookieTypeDetails(cookieType: string){

    let totalCookieList = Object.keys(CookieHelper.CookieDictNameToDetails);
    let cookiesFoundInType = [];

    let renderedCookieDetails = [];
    for(let i=0; i<totalCookieList.length; i++){
      let specificCookieName = totalCookieList[i];
      let specificCookieDetails = ConfigHolder.plugin.getCookieDetails(specificCookieName);
      let specificCookieType = specificCookieDetails?.type;
      if(specificCookieType===cookieType){
        cookiesFoundInType.push(specificCookieName);
        renderedCookieDetails.push(renderSpecificCookieDetails(specificCookieName, specificCookieDetails));
      }
    }
    let amountCookiesFoundInType = cookiesFoundInType.length;

    let leftIcon = (
      <View>
        <Text>{"("+amountCookiesFoundInType+")"}</Text>
      </View>
    )

    let translation_text = ConfigHolder.plugin.getCookieGroupName(cookieType)



    return(
      <View style={{width: "100%", flex: 1}} key={"cookieTypeDetails"+cookieType} >
        <SettingsRow accessibilityLabel={translation_text} accessibilityRole={AccessibilityRoles.button} leftIcon={leftIcon} leftContent={<Text>{translation_text}</Text>}>
          <View style={{width: "100%", flex: 1}}>
            {renderSpecificCookieDetailsTableHeader()}
            {renderedCookieDetails}
          </View>
        </SettingsRow>
      </View>
    )
  }

  function renderCookieDetailsForAdditionalGroups(){
    const additional_groups = ConfigHolder.plugin.getCookieAdditionalGroups()
    if(additional_groups.length===0){
      return null;
    } else {
      let output = [];
      for(let i=0; i<additional_groups.length; i++){
        let group = additional_groups[i];
        output.push(renderCookieTypeDetails(group));
      }
      return output;
    }
  }

  function renderCookieDetails(){
    return(
      <View style={{width: "100%", flex: 1}}>
        <ScrollViewWithGradient>
          <View style={{
            flex: 1,
            width: "100%",
            alignItems: "center", justifyContent: "center",
            flexDirection: 'row',
            flexWrap: 'wrap', // Enable wrapping of items
          }}>
            <View style={{width: "100%"}}>
              <View style={{width: "100%"}}>
                {renderCookieTypeDetails(CookieGroupEnum.Necessary)}
                {renderCookieDetailsForAdditionalGroups()}
              </View>
            </View>
          </View>
        </ScrollViewWithGradient>
      </View>
    )
  }


  function renderCookiesAbout(){
      return (
        <View style={{width: "100%"}}>
          <ScrollViewWithGradient>
            <View style={{
              flex: 1,
              width: "100%",
              alignItems: "center", justifyContent: "center",
              flexDirection: 'row',
              flexWrap: 'wrap', // Enable wrapping of items
            }}>
              <View style={{width: "100%"}}>
                {ConfigHolder.plugin.getCookieComponentAbout()}
              </View>
            </View>
          </ScrollViewWithGradient>
        </View>
      )
  }

  return (
      <Modal isOpen={true} style={{width: "100%", height: "100%", padding: Layout.padding}}>
        <KitchenSafeAreaView style={{width: width, height: "100%", borderRadius: Layout.padding, overflow: "hidden"}}>
          <View style={{width: width, height: "100%"}}>
            <AlertDialog.Header style={{padding: Layout.padding}}>
              <View style={{flexDirection: "row"}}>
                <ProjectLogo size={"sm"} rounded={true} />
                <View style={{ marginLeft: 16}}>
                  <Heading>
                    {translation_cookies}
                  </Heading>
                </View>
              </View>
            </AlertDialog.Header>
            <View style={{width: "100%", paddingHorizontal: Layout.padding, flex: 1, backgroundColor: backgroundColor}}>
              <DetailsComponentMenus useScrollViewForHeader={true} size={"xs"} flex={1} menus={menus} defaultMenuKey={default_menu_key} key={default_menu_key} />
            </View>
            <AlertDialog.Footer
              style={{
                padding: Layout.padding,
              }}
            >
              <View style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                width: "100%",
                flexWrap: "wrap",
              }}>
                <Button accessibilityLabel={translation_cookie_policy_button_deny_all} size={"xs"} onPress={denyCookiesAll} style={{backgroundColor: defaultButtonColor, marginTop: 4}}>
                  <Text color={defaultButtonContrastColor}>
                    {translation_cookie_policy_button_deny_all}
                  </Text>
                </Button>
                <View style={{width: 4}} />
                <Button accessibilityLabel={translation_save_current_selection} size={"xs"} style={{backgroundColor: project_color, marginTop: 4}} onPress={acceptCookiesSelected}>
                  <Text color={project_color_contrast_color}>
                    {translation_save_current_selection}
                  </Text>
                </Button>
                <View style={{width: 4}} />
                <Button accessibilityLabel={translation_cookie_policy_button_accept_all} size={"xs"} onPress={acceptCookiesAll} style={{backgroundColor: project_color, marginTop: 4}}>
                  <Text color={project_color_contrast_color}>
                    {translation_cookie_policy_button_accept_all}
                  </Text>
                </Button>
              </View>
            </AlertDialog.Footer>
          </View>
        </KitchenSafeAreaView>

      </Modal>
  );
}
