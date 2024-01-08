import React, {FunctionComponent} from "react";
import {View} from "native-base";
import {BaseNoScrollTemplate} from "../../../kitcheningredients";
import {ConversationComponent} from "../../components/conversations/ConversationComponent";
import {ConversationHeader} from "../../components/conversations/ConversationHeader";

export const Conversation: FunctionComponent = (props) => {


  return (
      <View style={{width: "100%", height: "100%"}}>
          <BaseNoScrollTemplate header={<ConversationHeader route={props.route} />} route={props.route} >
              <ConversationComponent route={props.route} />
          </BaseNoScrollTemplate>
      </View>
  )
}
