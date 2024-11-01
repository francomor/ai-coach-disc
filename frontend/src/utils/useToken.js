import { useState } from "react";

function useToken() {
  const [token, setToken] = useState(() => {
    const userToken = localStorage.getItem("token");
    return userToken && userToken;
  });

  function saveToken(userToken) {
    localStorage.setItem("token", userToken);
    setToken(userToken);
  }

  function removeToken() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return {
    setToken: saveToken,
    token,
    removeToken,
  };
}

export default useToken;
