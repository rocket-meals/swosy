import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

type IconButtonProps = TouchableOpacityProps & {
  padding?: number;
  children: React.ReactNode;
};

const IconButton: React.FC<IconButtonProps> = ({ children, padding = 5, style, ...rest }) => {
  return (
    <TouchableOpacity
      {...(rest as TouchableOpacityProps)}
      style={[{ padding }, style]}
      activeOpacity={rest.activeOpacity ?? 0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

export default IconButton;
