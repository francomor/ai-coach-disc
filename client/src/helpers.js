import {myConfig} from "./config";
import axios from "axios";


function AskToTheBot(chatMessages, persona, accessToken, setToken, removeToken, dispatch) {
  axios({
      method: "POST",
      url: myConfig.apiUrl.concat("/chat_completion"),
      headers: {
          "Content-Type": "application/json",
          "Authorization": 'Bearer ' + accessToken
      },
      data: JSON.stringify(chatMessages)
  })
  .then((response) => {
      const data = response.data;
      const bot_messages = data.messages;
      if (data.access_token) {
          setToken(data.access_token);
      }
      for (let i = 0; i < bot_messages.length; i++) {
          const bot_message = bot_messages[i];
          if (!bot_message || bot_message.startsWith("Error: ")) {
              dispatch({
                  type: "BOT_ERROR_RESPONSE",
                  payload: {
                      userName: persona.name,
                      message: bot_message
                  }
              });
          }
          else {
              dispatch({
                  type: "BOT_SUCCESS_RESPONSE",
                  payload: {
                      userName: persona.name,
                      message: bot_message
                  }
              });
          }
      }

  }).catch((error) => {
      console.log(error.response)
      if (error.response) {
          if ([401, 403, 422].includes(error.response.status)) {
              removeToken();
          }
          console.log(error.response)
          console.log(error.response.status)
          console.log(error.response.headers)
      }
      dispatch({
          type: "BOT_ERROR_RESPONSE",
          payload: {
              userName: persona.name,
              message: error.message
          }
      });
  });
}

export default AskToTheBot;
