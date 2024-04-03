import {createContext, useReducer} from "react";

const initialState = {
  chatMessages: [],
  isWaitingForResponse: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "NEW_USER_INPUT": {
      return {
          chatMessages: [...state.chatMessages, {
              userType: "user",
              userName: action.payload.userName,
              message: action.payload.message,
              isErrorMessage: false
          }],
          isWaitingForResponse: true
      };
    }
    case "BOT_SUCCESS_RESPONSE": {
      return {
          chatMessages: [...state.chatMessages, {
              userType: "bot",
              userName: action.payload.userName,
              message: action.payload.message,
              isErrorMessage: false
          }],
          isWaitingForResponse: false
      };
    }
    case "BOT_ERROR_RESPONSE": {
      return {
          chatMessages: [...state.chatMessages, {
              userType: "bot",
              userName: action.payload.userName,
              message: action.payload.message,
              isErrorMessage: true
          }],
          isWaitingForResponse: false
      };
    }
    default: {
      return state;
    }
  }
};

export const ChatContext = createContext(undefined);

export const ChatProvider = ({ persona, children }) => {
  const value = useReducer(reducer, initialState);
  if (initialState.chatMessages.length === 0){
      initialState.chatMessages.push({
          userType: "bot",
          userName: persona.name,
          message: persona.firstMessage,
          isErrorMessage: false
      })
  }
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
