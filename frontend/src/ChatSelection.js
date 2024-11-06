import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ChatSelection.css";
import NavBar from "./components/NavBar/NavBar";

const ChatSelection = ({ groups, user, token }) => {
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // If there is only one group, navigate to the chat of that group
    if (groups.length === 1) {
      navigate(`/chat/group/${groups[0].id}`);
    }
  }, [groups, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Set initial state

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  return (
    <>
      <NavBar
        user={user}
        removeToken={token.removeToken}
        groupName=""
        isChatSelectionNavigationDisabled={true}
        accessToken={token.token}
        usebigLogo={!isMobile}
        groups={groups}
      />
      <div className="chat-selection-container">
        <div className="welcome-container">
          <h2 className="welcome-title">¡Bienvenido!</h2>
          <h2 className="select-text">Selecciona un modelo de coaching para comenzar:</h2>
        </div>
        <div className="group-container">
          {groups.map((group) => (
            <div key={group.id} className="chat-selection-card">
              <img src={group.image} alt={group.name} className="group-image" />
              <h3 className="group-name">{group.name}</h3>
              <Link to={`/chat/group/${group.urlSlug}`}>
                <button className="chat-button">
                  <span className="button-text">Ir al chat</span>
                  <span className="button-icon">&gt;</span> {/* ">" symbol */}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ChatSelection;
