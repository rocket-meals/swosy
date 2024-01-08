// @ts-nocheck
import React, {useEffect, useState} from "react";
import {Link, Skeleton, Text, View} from "native-base";
import {ExpandableDrawerItem} from "../../navigation/ExpandableDrawerItem";
import {ConfigHolder} from "../../ConfigHolder";
import {MenuItem} from "./../../navigation/MenuItem";

export const PackagesWithLicenses = (props) => {

	// corresponding componentDidMount
	useEffect(() => {

	}, [])

	function getUrlToPackageInformation(dependencyKey){
		return "https://www.npmjs.com/package/"+dependencyKey;
	}

	function renderAllPackages(){
		let output = [];
		let dependencies = ConfigHolder.currentpackageJson?.dependencies || {};
		let lockPackageDependencies = ConfigHolder.currentpackageJsonLock?.packages || {};

		let dependencyKeys = Object.keys(dependencies);
		for(let dependencyKey of dependencyKeys){
			let upperVersion = dependencies[dependencyKey];

			let keyInPackageLockDependency = "node_modules/"+dependencyKey;
			let packageLockDependency = lockPackageDependencies[keyInPackageLockDependency] || {};
			let currentVersion = packageLockDependency?.version;

			let thirdpartyDependency = ConfigHolder.thirdpartyLicense[dependencyKey+"@"+currentVersion];

			output.push(renderPackage(dependencyKey, upperVersion, currentVersion, thirdpartyDependency));
		}
		return output;
	}

	function getSubMenuRow(icon, label, text){
	  if(!text){
	    return null;
    }

    let content = <Text></Text>;

		if(!!text){
      content = <Text><Text bold={true}>{label+": "}</Text>{text}</Text>;
		}

		return new MenuItem({
      key: label,
      content: content,
      icon: icon,
    });
	}

	function getSubMenuWithLink(icon, label, url){
    let content = (
      <Text>
      </Text>
    );

		if(!!url){
      content = (
        <Text>
          <Text bold={true}>{label+": "}</Text>
          <Link href={url} >
            <Text>{url}</Text>
          </Link>
        </Text>
      );
		}


    return new MenuItem({
      key: url,
      content: content,
      icon: icon,
    });
	}

	function getPackageChildrenMenu(dependencyKey, upperVersion, currentVersion, thirdpartyDependency){
		let repositoryUrl = thirdpartyDependency?.repository;
    let url = thirdpartyDependency?.url;
    let backupUrl = url || repositoryUrl;

    let packageUrl = getUrlToPackageInformation(dependencyKey);
		let license = thirdpartyDependency?.licenses
		let publisher = thirdpartyDependency?.publisher
		let email = thirdpartyDependency?.email

    return [
      getSubMenuWithLink("web", "Website",url || repositoryUrl),
      getSubMenuRow("license", "License", license),
      getSubMenuRow("account-circle", "Publisher", publisher),
      getSubMenuRow("email", "Email", email),
      getSubMenuWithLink("github", "GitHub",repositoryUrl || backupUrl),
    ]
	}

	function renderPackage(dependencyKey, upperVersion, currentVersion, thirdpartyDependency){
	  let label = dependencyKey;
	  let key = dependencyKey;

	  let menuItem = new MenuItem({
      key: dependencyKey,
      label: label,
    });
	  let subMenus = getPackageChildrenMenu(dependencyKey, upperVersion, currentVersion, thirdpartyDependency);
    menuItem.addChildMenuItems(subMenus)

		return (
			<View key={dependencyKey} style={{paddingBottom: 10, width: "100%"}}>
				<ExpandableDrawerItem
          key={key}
					level={2}
          menu={menuItem}>
				</ExpandableDrawerItem>
			</View>
		);
	}

	return(
		<>
			{renderAllPackages()}
		</>
	)
}
