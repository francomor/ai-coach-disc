import React from "react";
import "./Message.css";

const Message = ({ userType, message, isErrorMessage, participantName }) => {
  let messageTypeClass;
  if (userType === "user") {
    messageTypeClass = "user-message";
  } else if (userType === "assistant") {
    messageTypeClass = "bot-message";
  } else {
    messageTypeClass = "info-message";
  }

  const errorMessageClass = isErrorMessage ? "error-message" : "";

  return (
    <div className={`message-container ${messageTypeClass} ${errorMessageClass}`}>
      {participantName && userType !== "system" && <div className="message-participant-name">{participantName}</div>}
      <div className="message">
        {messageTypeClass === "info-message" && "---- "}
        {message}
        {messageTypeClass === "info-message" && " ----"}
      </div>
    </div>
  );
};

export default Message;
