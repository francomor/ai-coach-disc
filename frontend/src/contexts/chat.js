import { createContext, useReducer } from "react";

const initialState = {
  chatMessages: [],
  isWaitingForResponse: false,
  selectedParticipants: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case "NEW_USER_INPUT": {
      return {
        ...state,
        chatMessages: [
          ...state.chatMessages,
          {
            messageType: "user",
            participantName: action.payload.participantName,
            message: action.payload.message,
            isErrorMessage: false,
          },
        ],
        isWaitingForResponse: true,
      };
    }
    case "BOT_SUCCESS_RESPONSE": {
      return {
        ...state,
        chatMessages: [
          ...state.chatMessages,
          {
            messageType: "assistant",
            participantName: action.payload.participantName,
            message: action.payload.message,
            isErrorMessage: false,
          },
        ],
        isWaitingForResponse: false,
      };
    }
    case "BOT_ERROR_RESPONSE": {
      return {
        ...state,
        chatMessages: [
          ...state.chatMessages,
          {
            messageType: "assistant",
            participantName: action.payload.participantName,
            message: action.payload.message,
            isErrorMessage: true,
          },
        ],
        isWaitingForResponse: false,
      };
    }
    case "LOAD_CHAT_HISTORY": {
      return {
        ...state,
        chatMessages: [...action.payload.chatHistory],
      };
    }
    case "LOAD_MORE_HISTORY": {
      return {
        ...state,
        chatMessages: [...action.payload.moreHistory, ...state.chatMessages],
      };
    }
    case "SELECT_PARTICIPANT": {
      return {
        ...state,
        selectedParticipants: [...state.selectedParticipants, action.payload.participant],
        chatMessages: [
          ...state.chatMessages,
          {
            messageType: "system",
            participantName: action.payload.participant.name,
            message: action.payload.message,
            isErrorMessage: false,
          },
        ],
      };
    }
    case "DESELECT_PARTICIPANT": {
      return {
        ...state,
        selectedParticipants: state.selectedParticipants.filter((p) => p.id !== action.payload.participant.id),
        chatMessages: [
          ...state.chatMessages,
          {
            messageType: "system",
            participantName: action.payload.participant.name,
            message: action.payload.message,
            isErrorMessage: false,
          },
        ],
      };
    }
    default: {
      return state;
    }
  }
};

export const ChatContext = createContext(undefined);

export const ChatProvider = ({ children }) => {
  const value = useReducer(reducer, initialState);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
