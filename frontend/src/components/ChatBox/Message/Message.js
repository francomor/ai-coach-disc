import React from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "./Message.css";

const Message = ({ userType, message, isErrorMessage, participantName, isAnimated }) => {
  const messageTypeClass = userType === "user" ? "user-message" : "bot-message";
  const errorMessageClass = isErrorMessage ? "error-message" : "";

  // Conditionally render the animation if isAnimated is true
  const renderContent = () => {
    if (isAnimated) {
      return (
        <div className="thinking-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      );
    }

    // Parse the Markdown message and sanitize the HTML
    const parsedMessage = isErrorMessage ? "Error: " + message : DOMPurify.sanitize(marked(message));
    return <div className="message" dangerouslySetInnerHTML={{ __html: parsedMessage }} />;
  };

  return <div className={`message-container ${messageTypeClass} ${errorMessageClass}`}>{renderContent()}</div>;
};

export default Message;
