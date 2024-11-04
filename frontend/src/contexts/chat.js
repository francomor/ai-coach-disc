import { createContext, useReducer } from "react";

const initialState = {
  chatHistories: {},
  isWaitingForResponse: false,
  selectedParticipant: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "NEW_USER_INPUT": {
      const { participantId, message } = action.payload;
      return {
        ...state,
        chatHistories: {
          ...state.chatHistories,
          [participantId]: [
            ...(state.chatHistories[participantId] || []),
            {
              messageType: "user",
              participantName: action.payload.participantName,
              message: message,
              isErrorMessage: false,
              timestamp: new Date().toISOString(),
            },
          ],
        },
        isWaitingForResponse: true,
      };
    }
    case "BOT_SUCCESS_RESPONSE": {
      const { participantId, message, participantName } = action.payload;
      return {
        ...state,
        chatHistories: {
          ...state.chatHistories,
          [participantId]: [
            ...(state.chatHistories[participantId] || []),
            {
              messageType: "assistant",
              participantName: participantName,
              message: message,
              isErrorMessage: false,
              timestamp: new Date().toISOString(),
            },
          ],
        },
        isWaitingForResponse: false,
      };
    }
    case "BOT_ERROR_RESPONSE": {
      const { participantId, message, participantName } = action.payload;
      return {
        ...state,
        chatHistories: {
          ...state.chatHistories,
          [participantId]: [
            ...(state.chatHistories[participantId] || []),
            {
              messageType: "assistant",
              participantName: participantName,
              message: message,
              isErrorMessage: true,
              timestamp: new Date().toISOString(),
            },
          ],
        },
        isWaitingForResponse: false,
      };
    }
    case "LOAD_CHAT_HISTORY": {
      return {
        ...state,
        chatHistories: {
          ...state.chatHistories,
          [action.payload.participantId]: action.payload.chatHistory,
        },
      };
    }
    case "LOAD_MORE_HISTORY": {
      const { participantId, chatHistory } = action.payload;
      return {
        ...state,
        chatHistories: {
          ...state.chatHistories,
          [participantId]: [
            ...chatHistory, // Append older messages at the beginning
            ...(state.chatHistories[participantId] || []),
          ],
        },
      };
    }
    case "SELECT_PARTICIPANT": {
      return {
        ...state,
        selectedParticipant: action.payload.participant,
      };
    }
    case "DESELECT_PARTICIPANT": {
      return {
        ...state,
        selectedParticipant: null,
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
