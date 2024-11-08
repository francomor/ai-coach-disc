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
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import { ChatContext } from "../../contexts/chat";
import {
  addParticipant,
  fetchParticipants,
  editParticipant,
  fetchParticipantFileHistory,
  uploadParticipantFile,
} from "../../helpers";
import "./ParticipantList.css";

const ParticipantList = ({ accessToken, groupId }) => {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentParticipantId, setCurrentParticipantId] = useState(null);
  const [participantName, setParticipantName] = useState("");
  const [nameError, setNameError] = useState("");
  const [participants, setParticipants] = useState([]);
  const [fileHistory, setFileHistory] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
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
    fetchParticipantsList();
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
    if (!participantName) {
      setNameError("El nombre es obligatorio");
      return false;
    } else if (participantName.length < 2 || participantName.length > 20) {
      setNameError("El nombre debe tener entre 2 y 20 caracteres");
      return false;
    } else {
      setNameError("");
      return true;
    }
  };

  const handleAddParticipant = async () => {
    if (!validateInputs()) return;

    try {
      const response = await addParticipant(accessToken, groupId, participantName);
      if (selectedFile) await uploadParticipantFile(accessToken, selectedFile, response.participant.id);
      setDialogOpen(false);
      setParticipantName("");
      setSelectedFile(null);
      fetchParticipantsList();
      setUploadSuccess(true);
    } catch (error) {
      console.error("Error adding participant:", error);
      setUploadError("Error adding participant. Please try again.");
    }
  };

  const handleEditParticipant = async () => {
    if (!validateInputs()) return;

    try {
      await editParticipant(accessToken, currentParticipantId, participantName);
      if (selectedFile) await handleFileUpload();
      setDialogOpen(false);
      setEditMode(false);
      setParticipantName("");
      fetchParticipantsList();
      setUploadSuccess(true);
    } catch (error) {
      console.error("Error editing participant:", error);
      setUploadError("Error editing participant. Please try again.");
    }
  };

  const openParticipantDialog = (participant = null) => {
    if (participant) {
      setEditMode(true);
      setCurrentParticipantId(participant.id);
      setParticipantName(participant.name);
      fetchFileHistoryForParticipant(participant.id);
    } else {
      setEditMode(false);
      setParticipantName("");
      setSelectedFile(null);
      setCurrentParticipantId(null);
    }
    setDialogOpen(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      editMode ? handleEditParticipant() : handleAddParticipant();
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const fetchFileHistoryForParticipant = async (participantId) => {
    try {
      const history = await fetchParticipantFileHistory(accessToken, participantId);
      setFileHistory((prevHistory) => ({
        ...prevHistory,
        [participantId]: history,
      }));
    } catch (error) {
      console.error("Error fetching participant file history:", error);
    }
  };

  const handleFileUpload = async () => {
    if (selectedFile && currentParticipantId) {
      setIsUploading(true);
      setUploadError("");
      try {
        await uploadParticipantFile(accessToken, selectedFile, currentParticipantId);
        setSelectedFile(null);
        fetchFileHistoryForParticipant(currentParticipantId);
        setUploadSuccess(true);
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploadError("Error uploading file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className={`participant-list-container ${open ? "expanded" : "collapsed"}`}>
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
              <IconButton onClick={() => openParticipantDialog(participant)}>
                <EditIcon />
              </IconButton>
            </ListItem>
          ))}

          {/* Show Add Participant button only if participants count is less than 5 */}
          {participants.length < 5 && (
            <ListItem
              key="add-participant"
              className={`participant-item ${open ? "participant-item-expanded" : "participant-item-collapsed"}`}
              style={{ display: "flex", justifyContent: "space-evenly", alignItems: "center", width: "100%" }}
            >
              <IconButton onClick={() => openParticipantDialog()}>
                <AddIcon />
              </IconButton>
            </ListItem>
          )}
        </List>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} disableEnforceFocus disableAutoFocus>
        <DialogTitle>{editMode ? "Editar participante" : "Agregar nuevo participante"}</DialogTitle>
        <DialogContent onKeyDown={handleKeyDown}>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            error={!!nameError}
            helperText={nameError}
          />
          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <input
              accept="application/pdf"
              id="upload-file"
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <label htmlFor="upload-file">
              <Button variant="outlined" component="span">
                Elegir archivo
              </Button>
            </label>
            <Typography
              variant="body2"
              sx={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {selectedFile ? selectedFile.name : "No hay archivo seleccionado"}
            </Typography>
            {editMode && (
              <Button variant="contained" onClick={handleFileUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? <CircularProgress size={24} /> : "Subir PDF"}
              </Button>
            )}
          </Box>
          {isUploading && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Procesar el archivo demora al menos 1 minuto, por favor no cierre esta ventana
            </Typography>
          )}
          {uploadError && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {uploadError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={editMode ? handleEditParticipant : handleAddParticipant}>
            {editMode ? "Guardar" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={uploadSuccess}
        autoHideDuration={3000}
        onClose={() => setUploadSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setUploadSuccess(false)} severity="success" sx={{ width: "100%" }}>
          Archivo subido con éxito.
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ParticipantList;
