import axios from "axios";
import { myConfig } from "./config";

export const fetchUserDataAndGroups = async (token) => {
  try {
    const response = await axios.get(`${myConfig.apiUrl}/user_groups`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user data and groups:", error);
    throw error;
  }
};

export const logMeIn = async (username, password, setToken, setErrorValue) => {
  try {
    const response = await axios({
      method: "POST",
      url: myConfig.apiUrl.concat("/token"),
      data: {
        username: username,
        password: password,
      },
    });
    setToken(response.data.access_token);
    setErrorValue("");
    return { success: true };
  } catch (error) {
    if (error.response && error.response.data.msg) {
      const errorMsg = error.response.data.msg;
      setErrorValue(errorMsg);

      if (errorMsg === "User not found") {
        return { success: false, field: "username" };
      } else if (errorMsg === "Wrong password") {
        return { success: false, field: "password" };
      }
    } else {
      setErrorValue("An unexpected error occurred.");
    }
    return { success: false, field: null };
  }
};

export const logMeOut = async (accessToken, removeToken) => {
  try {
    await axios({
      method: "POST",
      url: myConfig.apiUrl.concat("/logout"),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    removeToken();
  } catch (error) {
    if ([401, 403, 422].includes(error.response.status)) {
      removeToken();
    }
    console.log(error.response);
  }
};

export const fetchChatHistory = async (groupId, token, participantId, offset = 0) => {
  if (!participantId) {
    return [];
  }

  try {
    const response = await axios.get(`${myConfig.apiUrl}/chat_history/${groupId}/${participantId}?offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

export const sendMessage = async (groupId, content, participant, token, setToken, removeToken, dispatch, userName) => {
  try {
    const payload = {
      groupId: groupId,
      content: content,
      participant: { id: participant.id, name: participant.name },
    };

    const response = await axios.post(`${myConfig.apiUrl}/send_message`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = response.data;
    const botMessages = data.messages;

    if (data.access_token) {
      setToken(data.access_token);
    }

    botMessages.forEach((msg) => {
      const { participantName, message, messageType, participantId } = msg;
      if (messageType === "assistant") {
        dispatch({
          type: "BOT_SUCCESS_RESPONSE",
          payload: {
            participantId: participantId,
            message: message,
            participantName: participantName,
          },
        });
      } else if (messageType === "user") {
        dispatch({
          type: "NEW_USER_INPUT",
          payload: {
            participantId: participantId,
            message: message,
            participantName: userName,
          },
        });
      }
    });

    return data;
  } catch (error) {
    if (error.response && [401, 403, 422].includes(error.response.status)) {
      removeToken();
    }
    console.error("Error sending message:", error);
    dispatch({
      type: "BOT_ERROR_RESPONSE",
      payload: {
        participantId: null,
        participantName: userName,
        message: error.message,
      },
    });
    throw error;
  }
};
