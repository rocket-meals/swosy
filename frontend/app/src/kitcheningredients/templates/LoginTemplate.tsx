// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from 'react';
import {Flex, KeyboardAvoidingView, useBreakpointValue, View, Wrap, Text} from "native-base";
import ServerAPI from "../ServerAPI";
import {Floaters} from "./Floaters";
import {ScrollViewWithGradient} from "../utils/ScrollViewWithGradient";
import {Platform, StatusBar} from "react-native";
import {ProjectBanner} from "../project/ProjectBanner";
import {ProjectBackground} from "../project/ProjectBackground";
import {ShowMoreGradientPlaceholder} from "../utils/ShowMoreGradientPlaceholder";
import {KitchenSafeAreaView} from "../components/KitchenSafeAreaView";
import {LegalRequiredLinks} from "../screens/legalRequirements/LegalRequiredLinks";
import {CookieInformation} from "../screens/legalRequirements/CookieInformation";
import {ConfigHolder} from "../ConfigHolder";
import {TranslationKeys} from "../translations/TranslationKeys";

export const LoginTemplate: FunctionComponent = (props) => {
	/**
	breakpoints = {
		base: 0,
		sm: 480,
		md: 768,
		lg: 992,
		xl: 1280,
	};
	 */

	let renderLoginTopRight = ConfigHolder.plugin.renderLoginTemplateTopRight;

	const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
	const translation_by_continuing_you_agree_to_terms_and_conditions_and_privacy_policy = useTranslation(TranslationKeys.by_continuing_you_agree_to_terms_and_conditions_and_privacy_policy);

  const paddingTop = Platform.OS === "android" ? StatusBar.currentHeight : 0
  const keyboardVerticalOffset = paddingTop;
	const isSmallDevice = useBreakpointValue({
		base: true,
		md: false,
	})

  const serverInfo = ServerAPI.tempStore.serverInfo;

	function renderSpaceBetweenLogoAndSignIn(){
		return (
			<View style={{height: 12}}></View>
		)
	}

	function renderConsentTermsOfUseAndPrivacyPolicy(){
	  return(
	    <View style={{
	      flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <Text textAlign={"center"} fontSize={"sm"}>{translation_by_continuing_you_agree_to_terms_and_conditions_and_privacy_policy}</Text>
      </View>
    )
  }

	function renderLeftSide(){

		let padding = isSmallDevice ? 20: 80;
		let width = isSmallDevice ? "100%" : 500;

		return(
			<Flex style={{width: width, height: "100%"}}>
        <KeyboardAvoidingView
          keyboardVerticalOffset = {keyboardVerticalOffset} // adjust the value here if you need more padding
          style={{flex: 1, width: "100%"}}
          behavior={Platform.OS === "ios" ? "padding" : "height"} >
				<ScrollViewWithGradient style={{flex: 1}}>

          <CookieInformation />
					<View style={{paddingHorizontal: padding, paddingTop: padding, height: "100%", width: "100%"}}>
						<Wrap
              flexDirection="row"
              justify="space-between"
            >
              <ProjectBanner serverInfo={serverInfo} />
              {renderLoginTopRight()}
            </Wrap>
						{renderSpaceBetweenLogoAndSignIn()}
						{props.children}
					</View>
				</ScrollViewWithGradient>
        </KeyboardAvoidingView>
        <View style={{paddingHorizontal: padding, width: "100%"}}>
          {renderConsentTermsOfUseAndPrivacyPolicy()}
          <Wrap
            flexDirection="row"
            justify="center"
          >
            <LegalRequiredLinks />
          </Wrap>
        </View>
			</Flex>
		);
	}

	function renderRightSide(){
		if(isSmallDevice){
			return null;
		}

		return(
			<ProjectBackground />
		)
	}

	return (
    <KitchenSafeAreaView>
        <Flex
          style={{height: "100%", width: "100%"}}
          flexDirection="row"
        >
          {renderLeftSide()}
          {renderRightSide()}
          <Floaters />
        </Flex>
		</KitchenSafeAreaView>
	)
}
