import React from "react";
import NavBar from "./components/NavBar/NavBar";
import BioBox from "./components/BioBox/BioBox";
import ChatBox from "./components/ChatBox/ChatBox";
import ParticipantList from "./components/ParticipantList/ParticipantList";
import "./ChatApp.css";

const ChatApp = ({ participants, groupName, user, token, groupId, groups }) => {
  const isChatSelectionNavigationDisabled = groups.length === 1;

  return (
    <div className="chat-app-container">
      <NavBar
        user={user}
        removeToken={token.removeToken}
        groupName={groupName}
        isChatSelectionNavigationDisabled={isChatSelectionNavigationDisabled}
        accessToken={token.token}
        usebigLogo={false}
        groups={groups}
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
