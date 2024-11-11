import React, { useContext } from "react";
import Avatar from "@mui/material/Avatar";
import "./BioBox.css";
import { ChatContext } from "../../contexts/chat";

const BioBox = () => {
  const [chatState] = useContext(ChatContext);
  const { selectedParticipant } = chatState;

  if (!selectedParticipant) {
    return (
      <div className="bio-box">
        <Avatar sx={{ width: { xs: 45, md: 45 }, height: { xs: 45, md: 45 } }} />
        <div className="character-info">
          <div className="character-name">Chateando con tu perfil</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bio-box">
      <Avatar
        sx={{ width: { xs: 45, md: 45 }, height: { xs: 45, md: 45 } }}
        src={selectedParticipant.image}
        alt={selectedParticipant.name}
      />
      <div className="character-info">
        <div className="character-name">Chateando con el perfil de {selectedParticipant.name}</div>
        <div className="character-description">{selectedParticipant.description}</div>
      </div>
    </div>
  );
};

export default BioBox;
