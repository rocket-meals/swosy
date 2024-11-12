import React from 'react';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
// import package-lock.json
import thirdpartyLicenses from '../../../../licenses.json';
import {SettingsRow, SettingsRowExpandable} from "@/components/settings/SettingsRow";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRowNavigate, SettingsRowNavigateSimple} from "@/components/settings/SettingsRowNavigate";
import {CommonSystemActionHelper} from "@/helper/device/CommonSystemActionHelper";

export default function SettingsLicenseScreen() {

	function getUrlToPackageInformation(dependencyKey){
		return "https://www.npmjs.com/package/"+dependencyKey;
	}

	function renderAllPackages(){
		let output = [];
		let dependencies = thirdpartyLicenses || {};

		let dependencyKeys = Object.keys(dependencies);
		for(let dependencyKey of dependencyKeys){
			let licenseInformation = dependencies?.[dependencyKey];

			/**
			 * "react-secure-storage@1.3.2": {
			 *         "licenses": "MIT",
			 *         "repository": "https://github.com/sushinpv/react-secure-storage",
			 *         "licenseUrl": "https://github.com/sushinpv/react-secure-storage",
			 *         "parents": "rocket-meals-dev"
			 *     },
			 */

			// @directus/sdk@17.0.1

			// get position of last @
			let lastAt = dependencyKey.lastIndexOf("@");
			let packageName = dependencyKey.substring(0, lastAt);
			let currentVersion = dependencyKey.substring(lastAt+1);

			let license = licenseInformation?.licenses;
			let repositoryUrl = licenseInformation?.repository;
			let licenseUrl = licenseInformation?.licenseUrl;

			output.push(renderPackage(dependencyKey, packageName, currentVersion, license, repositoryUrl, licenseUrl));
		}
		return output;
	}

	function renderPackage(dependencyKey: string, packageName: string, currentVersion: string, license: string, repositoryUrl: string, licenseUrl: string){
		let label = packageName;

		let contents = [];
		if(!!packageName){
			contents.push(<SettingsRow labelLeft={"Package"} labelRight={packageName} accessibilityLabel={packageName} />)
		}
		if(!!currentVersion){
			contents.push(<SettingsRow labelLeft={"Version"} labelRight={currentVersion} accessibilityLabel={currentVersion} />)
		}
		if(!!license){
			contents.push(<SettingsRow labelLeft={"License"} labelRight={license} accessibilityLabel={license} />)
		}
		if(!!repositoryUrl){
			contents.push(<SettingsRowNavigate labelLeft={"Repository"} labelRight={repositoryUrl} accessibilityLabel={repositoryUrl} onPress={() => {
				CommonSystemActionHelper.openExternalURL(repositoryUrl, true)
			}} />)
		}
		if(!!licenseUrl){
			contents.push(<SettingsRowNavigate labelLeft={"License URL"} labelRight={licenseUrl} accessibilityLabel={licenseUrl} onPress={() => {
				CommonSystemActionHelper.openExternalURL(licenseUrl, true)
			}} />)
		}

		return (
			<>
				<SettingsRow key={dependencyKey} accessibilityLabel={label} labelLeft={label} labelRight={currentVersion} expandable={true}>
					<SettingsRowGroup>
						{contents}
					</SettingsRowGroup>
				</SettingsRow>
			</>
		);
	}

	return (
		<MySafeAreaView>
			<ScrollViewWithGradient>
					{renderAllPackages()}
			</ScrollViewWithGradient>
		</MySafeAreaView>
	);
}