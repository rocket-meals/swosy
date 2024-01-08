// @ts-nocheck
import React from 'react';
import {Button,} from 'native-base';
import {Icon} from "../components/Icon";
import {Navigation} from "../navigation/Navigation";

export const BackButton = ({color, ...props}: any) => {

  let usedColor = color;

  return(
    <Button style={{backgroundColor: "transparent"}} onPress={Navigation.navigateBack} >
      <Icon name={"chevron-left"} color={usedColor} />
    </Button>
  )
};
