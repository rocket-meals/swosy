import React from 'react';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
// import package-lock.json
import currentpackageJson from "../../../../package.json";
import currentpackageJsonLock from '../../../../package-lock.json';
import thirdpartyLicense from '../../../../thirdpartyLicense.json';
import {SettingsRow} from "@/components/settings/SettingsRow";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";

export default function SettingsLicenseScreen() {

	function getUrlToPackageInformation(dependencyKey){
		return "https://www.npmjs.com/package/"+dependencyKey;
	}

	function renderAllPackages(){
		let output = [];
		let dependencies = currentpackageJson?.dependencies || {};
		let lockPackageDependencies = currentpackageJsonLock?.packages || {};

		let dependencyKeys = Object.keys(dependencies);
		for(let dependencyKey of dependencyKeys){
			let upperVersion = dependencies[dependencyKey];

			let keyInPackageLockDependency = "node_modules/"+dependencyKey;
			let packageLockDependency = lockPackageDependencies[keyInPackageLockDependency] || {};
			let currentVersion = packageLockDependency?.version;

			let thirdpartyDependency = thirdpartyLicense[dependencyKey+"@"+currentVersion];

			output.push(renderPackage(dependencyKey, upperVersion, currentVersion, thirdpartyDependency));
		}
		return output;
	}

	function renderPackage(dependencyKey, upperVersion, currentVersion, thirdpartyDependency){
		let label = dependencyKey;
		let key = dependencyKey;

		let repositoryUrl = thirdpartyDependency?.repository;
		let url = thirdpartyDependency?.url;
		let backupUrl = url || repositoryUrl;

		let packageUrl = getUrlToPackageInformation(dependencyKey);
		let license = thirdpartyDependency?.licenses
		let publisher = thirdpartyDependency?.publisher
		let email = thirdpartyDependency?.email

		let contents = [];
		if(!!currentVersion){
			contents.push(<SettingsRow labelLeft={"Version"} labelRight={currentVersion} accessibilityLabel={currentVersion} />)
		}
		if(!!upperVersion){
			contents.push(<SettingsRow labelLeft={"Upper Version"} labelRight={upperVersion} accessibilityLabel={upperVersion} />)
		}
		if(!!license){
			contents.push(<SettingsRow labelLeft={"License"} labelRight={license} accessibilityLabel={license} />)
		}
		if(!!publisher){
			contents.push(<SettingsRow labelLeft={"Publisher"} labelRight={publisher} accessibilityLabel={publisher} />)
		}
		if(!!email){
			contents.push(<SettingsRow labelLeft={"Email"} labelRight={email} accessibilityLabel={email} />)
		}
		if(!!backupUrl){
			contents.push(<SettingsRow labelLeft={"Repository"} labelRight={backupUrl} accessibilityLabel={backupUrl} />)
		}

		return (
			<SettingsRow key={dependencyKey} accessibilityLabel={label} labelLeft={label} expandable={true}>
				<SettingsRowGroup>
					{contents}
				</SettingsRowGroup>
			</SettingsRow>
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