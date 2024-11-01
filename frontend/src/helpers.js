import axios from "axios";
import { myConfig } from "./config";

export const fetchUserDataAndGroups = async (token) => {
  try {
    const response = await axios.get(`${myConfig.apiUrl}/user_groups`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const { userData, groups } = response.data;
    return { userData, groups };
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

export const fetchChatHistory = async (groupId, token, offset = 0) => {
  try {
    const response = await axios.get(`${myConfig.apiUrl}/chat_history/${groupId}?offset=${offset}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

export const sendMessage = async (groupId, content, participants, token, setToken, removeToken, dispatch, userName) => {
  try {
    const payload = {
      groupId: groupId,
      content: content,
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    };

    const response = await axios({
      method: "POST",
      url: `${myConfig.apiUrl}/send_message`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify(payload),
    });

    const data = response.data;
    const botMessages = data.messages;

    if (data.access_token) {
      setToken(data.access_token);
    }

    botMessages.forEach((botMessage) => {
      const { participantName, message, messageType } = botMessage;

      if (!message || message.startsWith("Error: ")) {
        dispatch({
          type: "BOT_ERROR_RESPONSE",
          payload: {
            userType: messageType,
            message: message,
            participantName: participantName,
          },
        });
      } else {
        dispatch({
          type: "BOT_SUCCESS_RESPONSE",
          payload: {
            userType: messageType,
            message: message,
            participantName: participantName,
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
        userType: "bot",
        userName: userName,
        message: error.message,
      },
    });
    throw error;
  }
};

export const registerChatEvent = async (token, groupId, participant, content) => {
  try {
    await axios.post(
      `${myConfig.apiUrl}/register_chat_event`,
      {
        groupId: groupId,
        participantId: participant.id,
        content: content,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error) {
    console.error("Error registering chat event:", error);
  }
};
