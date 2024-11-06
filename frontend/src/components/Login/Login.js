import React, { useState } from "react";
import "./Login.css";
import { logMeIn } from "../../helpers";
import { useNavigate } from "react-router-dom";

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const Login = ({ setToken }) => {
  const [userNameValue, setUserNameValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [errorValue, setErrorValue] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isPasswordValid, setIsPasswordValid] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setIsEmailValid(true);
    setIsPasswordValid(true);
    const { success, field } = await logMeIn(userNameValue, passwordValue, setToken, setErrorValue);

    if (success) {
      navigate("/");
    } else {
      if (field === "username") {
        setIsEmailValid(false);
      } else if (field === "password") {
        setIsPasswordValid(false);
      }
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setUserNameValue(email);
    setIsEmailValid(isValidEmail(email));
  };

  const handlePasswordChange = (e) => {
    setPasswordValue(e.target.value);
    setIsPasswordValid(true);
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-box">
          <img src={`${process.env.PUBLIC_URL}/thomas_logo.png`} alt="Logo de Thomas" className="login-logo" />
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-user-input">
              <label htmlFor="username" className="login-label">
                Email
              </label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Ingresa tu email"
                className={`login-input ${!isEmailValid ? "invalid" : ""}`}
                aria-label="Email"
                value={userNameValue}
                onChange={handleEmailChange}
              />
            </div>
            <div className="login-user-input">
              <label htmlFor="password" className="login-label">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Ingresa tu contraseña"
                className={`login-input ${!isPasswordValid ? "invalid" : ""}`}
                aria-label="Contraseña"
                value={passwordValue}
                onChange={handlePasswordChange}
              />
            </div>
            <input type="submit" value="Iniciar sesión" className="login-btn-submit" />
            <div className="login-error">{errorValue}</div>
          </form>
        </div>
      </div>
      <div className="login-right">
        <div className="login-description">
          <p>AI COACH DISC</p>
          <h1>Chatea con un coach impulsado por IA para explorar tu propio perfil DISC y el de los miembros de tu equipo</h1>
          <p>
            Obtén información sobre estilos de comportamiento, motivaciones y estrategias de comunicación efectivas
            diseñadas para fomentar la colaboración y el crecimiento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
