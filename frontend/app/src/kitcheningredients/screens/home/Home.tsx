// @ts-nocheck
import React, {useEffect, useRef, useState} from "react";
import {Text} from "native-base";
import ServerAPI from "../../ServerAPI";
import {ConfigHolder} from "../../ConfigHolder";
import {keyof} from "ts-keyof";

export const Home = (props) => {

  const [test, setTest] = useState({});

  let customHomeComponent = ConfigHolder.plugin.getHomeComponent();
  if(!!customHomeComponent){
    return customHomeComponent;
  }

  async function loadInformation() {
    let storage = ConfigHolder.instance.storage;
    let expires = storage.get_auth_expires();
    let now = new Date();
    setTest({expires: expires, now: now});
  }

	// corresponding componentDidMount
	useEffect(() => {
	      loadInformation();
	}, [props?.route?.params])

	return(
		<>
			<Text>{"Welcome Home"}</Text>
      <Text>{"You may implement getHomeComponent in the Plugin"}</Text>
      <Text>{JSON.stringify(test)}</Text>
		</>
	)
}

Home.displayName = keyof({ Home });
