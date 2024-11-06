import React, { useEffect, useState, useContext } from "react";
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import { ChatContext } from "../../contexts/chat";
import { addParticipant, fetchParticipants } from "../../helpers";
import "./ParticipantList.css";

const ParticipantList = ({ accessToken, groupId }) => {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [nameError, setNameError] = useState("");
  const [participants, setParticipants] = useState([]);
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

  useEffect(() => {
    fetchParticipantsList(); // Fetch participants when component loads
  }, []);

  const fetchParticipantsList = async () => {
    try {
      const participantsData = await fetchParticipants(accessToken, groupId);
      setParticipants(participantsData);
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

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

  const validateInputs = () => {
    if (!newParticipantName) {
      setNameError("El nombre es obligatorio");
      return false;
    } else if (newParticipantName.length < 2 || newParticipantName.length > 20) {
      setNameError("El nombre debe tener entre 2 y 20 caracteres");
      return false;
    } else {
      setNameError("");
      return true;
    }
  };

  const handleAddParticipant = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      await addParticipant(accessToken, groupId, newParticipantName);
      setDialogOpen(false);
      setNewParticipantName("");
      fetchParticipantsList();
    } catch (error) {
      console.error("Error adding participant:", error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleAddParticipant();
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

      {/* Add Participant Button */}
      <Button variant="contained" onClick={() => setDialogOpen(true)}>
        Agregar participante
      </Button>

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
                  <ListItemText primary={<span className="participant-name">{participant.name}</span>} />
                </div>
              )}
            </ListItem>
          ))}
        </List>
      )}

      {/* Add Participant Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Agregar nuevo participante</DialogTitle>
        <DialogContent onKeyDown={handleKeyDown}>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            error={!!nameError}
            helperText={nameError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleAddParticipant}>Agregar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ParticipantList;
