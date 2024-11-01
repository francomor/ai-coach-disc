import React, {useState} from "react";
import './Login.css';
import axios from "axios";
import {myConfig} from "../../config";


const Login = ({setToken}) => {
  const [userNameValue, setUserNameValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [errorValue, setErrorValue] = useState("");

  function logMeIn(event) {
      axios({
        method: "POST",
        url: myConfig.apiUrl.concat("/token"),
        data: {
          username: userNameValue,
          password: passwordValue
         }
      })
      .then((response) => {
          setErrorValue("")
          setToken(response.data.access_token)
      }).catch((error) => {
        if (error.response) {
            setErrorValue(error.response.data.msg)
          }
      })

      setUserNameValue("")
      setPasswordValue("")

      event.preventDefault()
    }

  return (
      <div className="login-container">
        <div className="login-title">
            <h1>Coach DISC</h1>
        </div>
        <form onSubmit={logMeIn}>
          <div className="login-user-input">
            <input
              type="text"
              id="username"
              name="username"
              placeholder="username"
              className="login-input"
              onChange={(e) => setUserNameValue(e.target.value)}
            />
          </div>
          <div className="login-user-input">
            <input
              type="password"
              id="password"
              name="password"
              placeholder="password"
              className="login-input"
              onChange={(e) => setPasswordValue(e.target.value)}
            />
          </div>
          <input
            type="submit"
            value="LOGIN"
            className="login-btn-submit"
          />
          <div className="login-error">
              {errorValue}
          </div>
        </form>
      </div>
    );
};

export default Login;
