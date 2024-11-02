import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import useToken from "./utils/useToken";
import Login from "./components/Login/Login";
import NotFound from "./components/NotFound/NotFound";
import ChatApp from "./ChatApp";
import ChatSelection from "./ChatSelection";
import { fetchUserDataAndGroups } from "./helpers";
import { ChatProvider } from "./contexts/chat";

const App = () => {
  const { token, removeToken, setToken } = useToken();
  const [groups, setGroups] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  const tokenData = {
    token: token,
    removeToken: removeToken,
    setToken: setToken,
  };

  const checkTokenValidity = (token) => {
    try {
      const { exp } = jwtDecode(token);
      return exp * 1000 > Date.now();
    } catch (error) {
      console.error("Invalid token:", error);
      return false;
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const { userData, groups } = await fetchUserDataAndGroups(token);
      setUserData(userData);
      setGroups(groups);
    } catch (error) {
      console.error("Error fetching data:", error);
      removeToken();
    } finally {
      setLoading(false);
    }
  }, [token, removeToken]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (checkTokenValidity(token)) {
      setIsValidToken(true);
      setLoading(true);
      fetchData();
    } else {
      removeToken();
      setLoading(false);
    }
  }, [token, fetchData, removeToken]);

  if (token && loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login setToken={setToken} />} />

        {/* If authenticated, show chat selection and chat */}
        {token && isValidToken && userData && groups.length > 0 ? (
          <>
            <Route path="/" element={<ChatSelection user={userData} token={tokenData} groups={groups} />} />
            {groups.map((group) => (
              <Route
                key={group.id}
                path={`/chat/group/${group.id}`}
                element={
                  <ChatProvider>
                    <ChatApp
                      user={userData}
                      token={tokenData}
                      participants={group.participants}
                      groupName={group.name}
                      groupId={group.id}
                      groupCount={groups.length}
                    />
                  </ChatProvider>
                }
              />
            ))}
          </>
        ) : (
          // If not authenticated, redirect to the login
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}

        {/* Not found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
