import React, { useContext } from "react";
import Avatar from "@mui/material/Avatar";
import "./BioBox.css";
import { ChatContext } from "../../contexts/chat";

const BioBox = () => {
  const [chatState] = useContext(ChatContext);
  const { selectedParticipants } = chatState;

  if (selectedParticipants.length === 0) {
    return (
      <div className="bio-box">
        <Avatar sx={{ width: { xs: 45, md: 45 }, height: { xs: 45, md: 45 } }} />
        <div className="character-info">
          <div className="character-name">No participants</div>
        </div>
      </div>
    );
  }

  if (selectedParticipants.length === 1) {
    const participant = selectedParticipants[0];
    return (
      <div className="bio-box">
        <Avatar
          sx={{ width: { xs: 45, md: 45 }, height: { xs: 45, md: 45 } }}
          src={participant.image}
          alt={participant.name}
        />
        <div className="character-info">
          <div className="character-name">{participant.name}</div>
          <div className="character-description">{participant.description}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bio-box">
      <div className="avatar-group">
        {selectedParticipants.map((participant, index) => (
          <Avatar
            key={participant.id}
            sx={{ width: { xs: 40, md: 45 }, height: { xs: 40, md: 45 } }}
            className={`avatar-overlap ${index === 0 ? "first-avatar" : ""}`}
            src={participant.image}
            alt={participant.name}
          />
        ))}
      </div>
      <div className="character-info">
        <div className="character-name">{selectedParticipants.map((p) => p.name).join(", ")}</div>
      </div>
    </div>
  );
};

export default BioBox;
