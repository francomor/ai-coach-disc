import React, { useState, useEffect, useContext } from "react";
import { List, ListItem, ListItemAvatar, ListItemText, Avatar } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import { ChatContext } from "../../contexts/chat";
import "./ParticipantList.css";

const ParticipantList = ({ accessToken, groupId, participants = [] }) => {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const { selectedParticipant } = useContext(ChatContext)[0];
  const dispatch = useContext(ChatContext)[1];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      setOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleSelect = (participant) => {
    const isSelected = selectedParticipant && selectedParticipant.id === participant.id;

    if (!isSelected) {
      dispatch({
        type: "SELECT_PARTICIPANT",
        payload: {
          participant,
        },
      });
    } else {
      dispatch({
        type: "DESELECT_PARTICIPANT",
        payload: {},
      });
    }
  };

  return (
    <div className={`participant-list-container ${open ? "expanded" : "collapsed"}`}>
      {/* Header */}
      <div className={`header ${open ? "header-expanded" : "header-collapsed"}`}>
        {(isMobile || open) && <span className="header-title">Participantes</span>}
        <button onClick={handleToggle} className="toggle-button">
          {isMobile ? (
            open ? (
              <ExpandLessIcon sx={{ color: "white" }} />
            ) : (
              <ExpandMoreIcon sx={{ color: "white" }} />
            )
          ) : open ? (
            <KeyboardDoubleArrowLeftIcon sx={{ color: "white" }} />
          ) : (
            <KeyboardDoubleArrowRightIcon sx={{ color: "white" }} />
          )}
        </button>
      </div>

      {/* Participants List */}
      {(!isMobile || open) && (
        <List>
          {participants.map((participant) => (
            <ListItem
              key={participant.id}
              className={`participant-item ${open ? "participant-item-expanded" : "participant-item-collapsed"} ${
                selectedParticipant?.id === participant.id ? "selected" : ""
              }`}
              onClick={() => handleSelect(participant)}
            >
              <ListItemAvatar>
                <Avatar src={participant.image} alt={participant.name} />
              </ListItemAvatar>
              {open && (
                <div className="participant-info">
                  <ListItemText
                    primary={<span className="participant-name">{participant.name}</span>}
                    secondary={<span className="participant-details">{participant.description}</span>}
                  />
                </div>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
};

export default ParticipantList;
