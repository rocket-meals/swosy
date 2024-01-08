import React, {FunctionComponent} from "react";
import {ConversationHelper} from "./ConversationHelper";
import {HeaderWithActions} from "../../../kitcheningredients";

export const ConversationHeader: FunctionComponent = (props) => {

	const id = props?.route?.params?.id;

	const reloadAllChatrooms = ConversationHelper.useReloadAllChatrooms()
	const chatroom = ConversationHelper.useChatroom(id);
	const topicTitle = ConversationHelper.useChatroomTopicTitleByChatroomId(id)


	return(
		<HeaderWithActions route={props?.route} title={topicTitle} renderActions={null} renderCustomBottom={null} />
	)
}
