import React, { useContext, useEffect, useRef, useState } from "react";
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
  const [offset, setOffset] = useState(10);
  const prevSelectedParticipantsRef = useRef(chatState.selectedParticipants);
  const prevMessagesLengthRef = useRef(chatState.chatMessages.length);

  const noParticipantsSelected = chatState.selectedParticipants.length === 0;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    handleResize(); // Set initial state

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sortMessagesByTimestamp = (messages) => {
    return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const message = inputValue;
    setInputValue("");

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
      await sendMessage(
        groupId,
        message,
        chatState.selectedParticipants,
        accessToken,
        setToken,
        removeToken,
        dispatch,
        user.name,
      );

      setIsThinking(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsThinking(false);
    }
  };

  const loadMoreMessages = async () => {
    if (messagesContainerRef.current) {
      const previousHeight = messagesContainerRef.current.scrollHeight;

      setIsLoadingMore(true);
      try {
        const moreHistory = await fetchChatHistory(groupId, accessToken, offset);
        if (moreHistory.length > 0) {
          dispatch({
            type: "LOAD_MORE_HISTORY",
            payload: { moreHistory },
          });
          setOffset((prevOffset) => prevOffset + 10);

          const newHeight = messagesContainerRef.current.scrollHeight;
          const heightDiff = newHeight - previousHeight;
          messagesContainerRef.current.scrollTop += heightDiff;
        }
      } catch (error) {
        console.error("Error loading more history:", error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current.scrollTop === 0 && !isLoadingMore) {
      loadMoreMessages();
    }
  };

  useEffect(() => {
    const messagesAdded = chatState.chatMessages.length > prevMessagesLengthRef.current;

    const prevMessagesLength = prevMessagesLengthRef.current;

    prevSelectedParticipantsRef.current = chatState.selectedParticipants;
    prevMessagesLengthRef.current = chatState.chatMessages.length;

    if (messagesAdded) {
      const newMessages = chatState.chatMessages.slice(prevMessagesLength);
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage && lastMessage.messageType === "system" && isMobile) {
        // Do not scroll or focus when a system message is added on mobile
      } else {
        scrollToBottom();
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }
  }, [chatState.chatMessages, chatState.selectedParticipants, isMobile]);

  return (
    <div className="chat-box-container">
      <div className="chat-box-messages" ref={messagesContainerRef} onScroll={handleScroll}>
        {isLoadingMore && <div className="loading-more">Loading more messages...</div>}
        {chatState.chatMessages &&
          sortMessagesByTimestamp(chatState.chatMessages).map((messageChat, index) => (
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
          placeholder={noParticipantsSelected ? "No participants selected" : "Type your message..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={noParticipantsSelected || isThinking}
        />
        <button
          className="input-button"
          type="submit"
          disabled={noParticipantsSelected || isThinking || inputValue.trim() === ""}
        >
          &gt; {/* ">" symbol */}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
