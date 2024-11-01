import React from "react";
import './App.css';
import useToken from "./utils/useToken";
import Login from "./components/Login/Login";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import NotFound from "./components/NotFound/NotFound";
import data from "./data";
import ChatApp from "./ChatApp";

const App = ({persona, user}) => {
  const { token, removeToken, setToken } = useToken();
  const personaData = data.personaData;
  const userData = data.userData;

  const tokenData = {
    token: token,
    removeToken: removeToken,
    setToken: setToken
  }

  return (
    <BrowserRouter>
        {!token && token !== "" && token !== undefined ?
          <Login setToken={setToken} />
        :(
          <Routes>
              {personaData.map((persona) => (
                  <Route
                      key={persona.id}
                      path={persona.route}
                      element={<ChatApp
                          persona={persona}
                          user={userData}
                          token={tokenData}
                      />}
                  ></Route>
              ))}
              <Route path='/' element={<Navigate to={personaData[0].route} />} />
              <Route path='*' element={<NotFound />}/>
          </Routes>
        )}
    </BrowserRouter>
  );
};

export default App;
