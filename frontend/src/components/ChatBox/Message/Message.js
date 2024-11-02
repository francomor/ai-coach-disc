import React from "react";
import "./Message.css";

const Message = ({ userType, message, isErrorMessage, participantName }) => {
  const messageTypeClass = userType === "user" ? "user-message" : "bot-message";
  const errorMessageClass = isErrorMessage ? "error-message" : "";

  return (
    <div className={`message-container ${messageTypeClass} ${errorMessageClass}`}>
      {participantName && userType !== "system" && <div className="message-participant-name">{participantName}</div>}
      <div className="message">{message}</div>
    </div>
  );
};

export default Message;
