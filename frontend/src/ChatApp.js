import NavBar from "./components/NavBar/NavBar";
import BioBox from "./components/BioBox/BioBox";
import React, { useEffect, useContext } from "react";
import ChatBox from "./components/ChatBox/ChatBox";
import { ChatContext } from "./contexts/chat";
import "./ChatApp.css";
import ParticipantList from "./components/ParticipantList/ParticipantList";
import { fetchChatHistory } from "./helpers";

const ChatApp = ({ participants, groupName, user, token, groupId, groupCount }) => {
  const isChatSelectionNavigationDisabled = groupCount === 1;
  const [, dispatch] = useContext(ChatContext);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await fetchChatHistory(groupId, token.token);
        dispatch({
          type: "LOAD_CHAT_HISTORY",
          payload: { chatHistory: history },
        });
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };

    loadChatHistory();
  }, [groupId, token.token, dispatch]);

  return (
    <div className="chat-app-container">
      <NavBar
        user={user}
        removeToken={token.removeToken}
        groupName={groupName}
        isChatSelectionNavigationDisabled={isChatSelectionNavigationDisabled}
        accessToken={token.token}
        usebigLogo={false}
      />
      <div className="content-container">
        <ParticipantList accessToken={token.token} groupId={groupId} participants={participants} />
        <div className="chat-section">
          <BioBox />
          <ChatBox
            user={user}
            accessToken={token.token}
            setToken={token.setToken}
            removeToken={token.removeToken}
            groupId={groupId}
          />
        </div>
        <div id="footer"></div>
      </div>
    </div>
  );
};

export default ChatApp;
