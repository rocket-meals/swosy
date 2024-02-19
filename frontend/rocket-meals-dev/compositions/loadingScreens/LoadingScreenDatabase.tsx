import React, {FunctionComponent} from "react";
import {MySafeAreaView} from "@/components/MySafeAreaView";

interface AppState {
    children?: React.ReactNode;
}
export const LoadingScreenDatabase: FunctionComponent<AppState> = ({...props}) => {

  return (
      <MySafeAreaView>

      </MySafeAreaView>
  );
}
