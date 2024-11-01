import NavBar from "./components/NavBar/NavBar";
import React, {useState} from "react";
import ChatBox from "./components/ChatBox/ChatBox";
import {ChatProvider} from "./contexts/chat";
import './ChatApp.css';
import LogoIcon from "./components/NavBar/LogoIcon";
import PdfBox from "./components/PdfBox/PdfBox";

const ChatApp = ({persona, user, token}) => {
  const [pdfActiveFileName, setPdfActiveFileName] = useState("");

  return (
    <ChatProvider persona={persona}>
      <div className="app">
         <NavBar user={user} removeToken={token.removeToken} />
         {/*<BioBox persona={persona}/>*/}
         <PdfBox
             accessToken={token.token}
             setToken={token.setToken}
             removeToken={token.removeToken}
             pdfActiveFileName={pdfActiveFileName}
             setPdfActiveFileName={setPdfActiveFileName}
         />
         <ChatBox
             persona={persona}
             user={user}
             accessToken={token.token}
             setToken={token.setToken}
             removeToken={token.removeToken}
             pdfActiveFileName={pdfActiveFileName}
         />
      </div>
        <div className="footer">
            <LogoIcon sx={{
              display: { xs: 'flex', sm: 'none', md: 'none' },
              mr: 1,
              height: '40px',
              width: '60px',
              marginTop: '2rem',
          }} />
        </div>
    </ChatProvider>
  );
};

export default ChatApp;
