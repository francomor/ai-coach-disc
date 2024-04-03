import React from "react";
import "./Message.css";

const Message = ({userType, message, isErrorMessage}) => {
    let messageTypeClass;
    if (userType === "user") {
        messageTypeClass = "user-message"
    }
    else {
        messageTypeClass = "bot-message"
    }
    const errorMessageClass = isErrorMessage ? "error-message" : "";
    return (
        <div className= {`message ${messageTypeClass} ${errorMessageClass}`}>
            {message}
        </div>
    );
};

export default Message;
