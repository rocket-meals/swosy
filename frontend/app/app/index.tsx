import React from 'react'
import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';


const index = () => {
  const { loggedIn } = useSelector((state: any) => state.authReducer);
  if (loggedIn) {
    return <Redirect href='/(app)' />;
  } else {
    return <Redirect href='/(auth)/login' />;
  }
}

export default index;
