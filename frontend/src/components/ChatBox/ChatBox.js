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
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [offset, setOffset] = useState(0);

  const selectedParticipant = chatState.selectedParticipant;

  const chatMessages = useMemo(() => {
    return selectedParticipant ? chatState.chatHistories[selectedParticipant.id] || [] : [];
  }, [selectedParticipant, chatState.chatHistories]);

  useEffect(() => {
    if (selectedParticipant) {
      const loadChatHistory = async () => {
        try {
          setIsLoadingMore(true);
          const history = await fetchChatHistory(groupId, accessToken, selectedParticipant.id, offset);
          const existingMessageIds = new Set(chatMessages.map((msg) => msg.timestamp));
          const filteredHistory = history.filter((msg) => !existingMessageIds.has(msg.timestamp));

          if (filteredHistory.length > 0) {
            dispatch({
              type: "LOAD_CHAT_HISTORY",
              payload: { participantId: selectedParticipant.id, chatHistory: filteredHistory.reverse() },
            });
          }
          setIsLoadingMore(false);
        } catch (error) {
          console.error("Error loading chat history:", error);
          setIsLoadingMore(false);
        }
      };

      loadChatHistory();
    }
  }, [selectedParticipant, offset, groupId, accessToken, dispatch, chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const message = inputValue;
    setInputValue("");

    if (!selectedParticipant) return;

    dispatch({
      type: "NEW_USER_INPUT",
      payload: {
        userType: "user",
        message: message,
        participantName: user.name,
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
    if (messagesContainerRef.current.scrollTop === 0 && !isLoadingMore) {
      setOffset((prevOffset) => prevOffset + 10);
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
  }, [chatMessages, isThinking]);

  return (
    <div className="chat-box-container">
      <div className="chat-box-messages" ref={messagesContainerRef} onScroll={handleScroll}>
        {isLoadingMore && <div className="loading-more">Loading more messages...</div>}
        {chatMessages.map((messageChat, index) => (
          <Message
            key={index}
            userType={messageChat.messageType}
            message={messageChat.message}
            isErrorMessage={messageChat.isErrorMessage}
            participantName={messageChat.participantName}
          />
        ))}

        {isThinking && <Message userType="bot" message="Thinking..." />}

        <div ref={messagesEndRef} />
      </div>
      <form className="chat-box-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="input-text"
          ref={inputRef}
          placeholder={!selectedParticipant ? "No participant selected" : "Type your message..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!selectedParticipant || isThinking}
        />
        <button
          className="input-button"
          type="submit"
          disabled={!selectedParticipant || isThinking || inputValue.trim() === ""}
        >
          &gt; {/* ">" symbol */}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
