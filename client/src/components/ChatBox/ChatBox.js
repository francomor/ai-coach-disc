import React, {useContext, useEffect, useRef, useState} from "react";
import {ChatContext} from "../../contexts/chat";
import "./ChatBox.css";
import Message from "./Message/Message";
import AskToTheBot from "../../helpers";
import InChatInformation from "./InChatInformation/InChatInformation";

const ChatBox = ({persona, user, accessToken, setToken, removeToken, pdfActiveFileName}) => {
  const [chatState, dispatch] = useContext(ChatContext);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null)

  function onFormSubmit(e) {
    e.preventDefault();
    const message = inputValue;
    setInputValue("");
    dispatch({
        type: "NEW_USER_INPUT" ,
        payload: {
            userName: user.name,
            message: message
        }
    });
    const chatMessagesToAsk = [...chatState.chatMessages,{
          userType: "user",
          userName: user.name,
          message: message,
          isErrorMessage: false
      }];  // TODO: move the logic to the reducer
    AskToTheBot(chatMessagesToAsk, persona, accessToken, setToken, removeToken, dispatch);
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  useEffect(() => {
    scrollToBottom()
  }, [chatState.chatMessages]);

  return (
    <div className="chat-box-container">
        <div className="chat-box-messages">
            {chatState.chatMessages.length === 1 && <InChatInformation/>}
            {chatState.chatMessages.map((messageChat, index) => (
                <Message
                    key={index}
                    userType={messageChat.userType}
                    message={messageChat.message}
                    isErrorMessage={messageChat.isErrorMessage}
                />
            ))}
            {chatState.isWaitingForResponse && <Message userType="bot" message="Pensando..." />}
            <div ref={messagesEndRef} />
        </div>
        <form className="chat-box-input" onSubmit={onFormSubmit}>
            <input
                type="text"
                className="input-text"
                placeholder="Escribi tu mensaje..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={chatState.isWaitingForResponse}
            />
            <button
                className="input-button"
                type="submit"
                disabled={pdfActiveFileName === ""}
                style={{ backgroundColor: pdfActiveFileName !== "" ? '#007bff': 'grey' }}
            >Send</button>
        </form>
    </div>
  );
};

export default ChatBox;
