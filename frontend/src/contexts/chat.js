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
