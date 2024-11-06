import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import useToken from "./utils/useToken";
import Login from "./components/Login/Login";
import NotFound from "./components/NotFound/NotFound";
import ChatApp from "./ChatApp";
import ChatSelection from "./ChatSelection";
import Onboarding from "./components/Onboarding/Onboarding";
import { fetchUserDataAndGroups, completeOnboarding } from "./helpers";
import { ChatProvider } from "./contexts/chat";

const App = () => {
  const { token, removeToken, setToken } = useToken();
  const [groups, setGroups] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  const tokenData = {
    token: token,
    removeToken: removeToken,
    setToken: setToken,
  };

  const checkTokenValidity = useCallback((tokenToCheck) => {
    if (!tokenToCheck) return false;
    try {
      const { exp } = jwtDecode(tokenToCheck);
      return exp * 1000 > Date.now();
    } catch (error) {
      console.error("Invalid token:", error);
      return false;
    }
  }, []);

  const handleInvalidToken = useCallback(() => {
    setLoading(false);
    setDataFetchAttempted(true);
    removeToken();
  }, [removeToken]);

  const initializeApp = useCallback(async () => {
    if (dataFetchAttempted) return;

    if (!token || !checkTokenValidity(token)) {
      handleInvalidToken();
      return;
    }

    try {
      const { userData: newUserData, groups: newGroups } = await fetchUserDataAndGroups(token);
      setUserData(newUserData);
      setGroups(newGroups);
      setIsOnboardingComplete(newUserData.onboarding_complete);
      setDataFetchAttempted(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      handleInvalidToken();
    } finally {
      setLoading(false);
    }
  }, [token, checkTokenValidity, handleInvalidToken, dataFetchAttempted]);

  const handleOnboardingComplete = async (answers) => {
    try {
      await completeOnboarding(token, answers);
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    setDataFetchAttempted(false);
  }, [token]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />

        {token && userData && !isOnboardingComplete ? (
          <Route
            path="/"
            element={
              <Onboarding
                onComplete={handleOnboardingComplete}
                accessToken={token}
                user={userData}
                token={tokenData}
                groups={groups}
              />
            }
          />
        ) : token && userData && groups.length > 0 ? (
          <>
            <Route path="/" element={<ChatSelection user={userData} token={tokenData} groups={groups} />} />
            {groups.map((group) => (
              <Route
                key={group.id}
                path={`/chat/group/${group.urlSlug}`}
                element={
                  <ChatProvider>
                    <ChatApp
                      user={userData}
                      token={tokenData}
                      participants={group.participants}
                      groupName={group.name}
                      groupId={group.id}
                      groups={groups}
                    />
                  </ChatProvider>
                }
              />
            ))}
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
