import React from 'react'
import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';

// fix the setImmediate usage from react-native-reanimated
// https://github.com/expo/expo/issues/7996
import 'setimmediate'
if (!global.setImmediate) {
  global.setImmediate = setTimeout
}

const index = () => {
  const { loggedIn } = useSelector((state: any) => state.authReducer);
  if (loggedIn) {
    return <Redirect href='/(app)' />;
  } else {
    return <Redirect href='/(auth)/login' />;
  }
}

export default index;
