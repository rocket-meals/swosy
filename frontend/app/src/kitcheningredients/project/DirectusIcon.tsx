import React, { FunctionComponent, memo } from 'react';
import { Icon } from "../components/Icon";
import { MaterialIcons } from "@expo/vector-icons";
import { InterfaceIconProps } from "native-base/lib/typescript/components/primitives/Icon/types";

interface DirectusIconProps extends InterfaceIconProps {
  name?: string;
}

const DirectusIconComponent: FunctionComponent<DirectusIconProps> = ({ name = "", ...rest }) => {
  // Replace all underscores with hyphens for icon names
  const iconName = name.replace(/_/g, "-");

  // MaterialIcons is used as the default icon family
  const family = MaterialIcons;

  return <Icon as={family} name={iconName} {...rest} />;
};

export const DirectusIcon = memo(DirectusIconComponent);
