import React, { useContext, useEffect, useRef, useState, useMemo } from "react";
import { ChatContext } from "../../contexts/chat";
import "./ChatBox.css";
import Message from "./Message/Message";
import { sendMessage, fetchChatHistory } from "../../helpers";

const ChatBox = ({ user, accessToken, setToken, removeToken, groupId }) => {
  const [chatState, dispatch] = useContext(ChatContext);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
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
    const loadChatHistory = async () => {
      if (hasLoadedHistory) return; // Prevent re-loading if already loaded

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
        setHasLoadedHistory(true); // Mark history as loaded
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
      setHasLoadedHistory(false); // Allow loading more history on scroll
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

        {isThinking && <Message userType="bot" message="Pensando..." />}

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
          disabled={isThinking}
        />
        <button className="input-button" type="submit" disabled={isThinking || inputValue.trim() === ""}>
          &gt; {/* ">" symbol */}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
