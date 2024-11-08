import React, { useContext, useEffect, useRef, useState, useMemo } from "react";
import { ChatContext } from "../../contexts/chat";
import "./ChatBox.css";
import Message from "./Message/Message";
import { sendMessage, fetchChatHistory, fetchGroupFileHistory, uploadGroupFile } from "../../helpers";
import { Modal, Button, Snackbar, Alert, CircularProgress } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const ChatBox = ({ user, accessToken, setToken, removeToken, groupId }) => {
  const [chatState, dispatch] = useContext(ChatContext);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [hasFile, setHasFile] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [offset, setOffset] = useState(0);

  const selectedParticipant = chatState.selectedParticipant;
  const chatHistoryKey = selectedParticipant ? selectedParticipant.id : null;

  const chatMessages = useMemo(() => {
    return chatState.chatHistories[chatHistoryKey] || [];
  }, [chatHistoryKey, chatState.chatHistories]);

  useEffect(() => {
    setOffset(0);
    setHasLoadedHistory(false);
  }, [selectedParticipant]);

  useEffect(() => {
    const checkFileHistory = async () => {
      try {
        const history = await fetchGroupFileHistory(accessToken, groupId);
        setHasFile(history.length > 0);
        if (history.length === 0) setShowUploadModal(true);
      } catch (error) {
        console.error("Error fetching file history:", error);
      }
    };
    checkFileHistory();
  }, [groupId, accessToken]);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (hasLoadedHistory) return;

      try {
        setIsLoadingMore(true);
        const history = await fetchChatHistory(
          groupId,
          selectedParticipant ? selectedParticipant.id : null,
          offset,
          accessToken,
        );

        if (history && history.length > 0) {
          const actionType = offset === 0 ? "LOAD_CHAT_HISTORY" : "LOAD_MORE_HISTORY";
          dispatch({
            type: actionType,
            payload: { participantId: chatHistoryKey, chatHistory: history.reverse() },
          });
          messagesContainerRef.current.scrollTop += 600;
        }
        setHasLoadedHistory(true);
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        setIsLoadingMore(false);
      }
    };

    loadChatHistory();
  }, [chatHistoryKey, offset, groupId, accessToken, dispatch, hasLoadedHistory, selectedParticipant]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const message = inputValue;
    setInputValue("");

    // Add user's message to chat history instantly for a responsive UI
    dispatch({
      type: "NEW_USER_INPUT",
      payload: {
        userType: "user",
        message: message,
        participantName: user.name,
        participantId: chatHistoryKey,
      },
    });

    setIsThinking(true);
    try {
      await sendMessage(groupId, message, selectedParticipant, accessToken, setToken, removeToken, dispatch, user.name);

      setIsThinking(false);
      if (inputRef.current) inputRef.current.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      setIsThinking(false);
    }
  };

  const handleScroll = () => {
    if (chatMessages.length > 2 && messagesContainerRef.current.scrollTop === 0 && !isLoadingMore) {
      setOffset((prevOffset) => prevOffset + 10);
      setHasLoadedHistory(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (selectedFile && groupId) {
      setIsUploading(true);
      setUploadError(""); // Clear previous error
      try {
        await uploadGroupFile(accessToken, selectedFile, groupId);
        setSelectedFile(null);

        const history = await fetchGroupFileHistory(accessToken, groupId);
        setHasFile(history.length > 0);
        setShowUploadModal(false);
        setUploadSuccess(true);
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploadError("Error uploading file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedParticipant, chatMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isThinking]);

  useEffect(() => {
    if (messagesEndRef.current && offset === 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, offset]);

  return (
    <div className="chat-box-container">
      <div className="chat-box-messages" ref={messagesContainerRef} onScroll={handleScroll}>
        {isLoadingMore && <div className="loading-more">Cargando más mensajes...</div>}
        {chatMessages.map((messageChat, index) => (
          <Message
            key={index}
            userType={messageChat.messageType}
            message={messageChat.message}
            isErrorMessage={messageChat.isErrorMessage}
            participantName={messageChat.participantName}
          />
        ))}

        {isThinking && <Message userType="bot" message="..." />}

        <div ref={messagesEndRef} />
      </div>
      <form className="chat-box-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="input-text"
          ref={inputRef}
          placeholder="Escribe tu mensaje..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!hasFile || isThinking}
        />
        <button className="input-button" type="submit" disabled={!hasFile || isThinking || inputValue.trim() === ""}>
          &gt;
        </button>
      </form>

      {/* Modal for uploading a file */}
      <Modal open={showUploadModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Por favor, sube un archivo PDF
            </Typography>
          </Box>
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
              sx={{
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedFile ? selectedFile.name : "Ningún archivo seleccionado"}
            </Typography>
            <Button variant="contained" onClick={handleFileUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? <CircularProgress size={24} /> : "Subir PDF"}
            </Button>
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
        </Box>
      </Modal>

      {/* Snackbar for successful upload feedback */}
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

export default ChatBox;
