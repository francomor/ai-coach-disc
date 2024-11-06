import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Container from "@mui/material/Container";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { Menu, MenuItem, Modal, Button, List, ListItem, ListItemText, Tabs, Tab } from "@mui/material";
import { logMeOut, fetchFileHistory, uploadFile } from "../../helpers";

const NavBar = ({
  user,
  removeToken,
  groupName,
  isChatSelectionNavigationDisabled,
  accessToken,
  usebigLogo,
  groups,
}) => {
  const [anchorUser, setAnchorUser] = useState(null);
  const [openFileModal, setOpenFileModal] = useState(false);
  const [fileHistory, setFileHistory] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  const settings = [
    { text: "Mis archivos", onClick: () => setOpenFileModal(true) },
    { text: "Cerrar sesión", onClick: () => logMeOut(accessToken, removeToken) },
  ];

  const handleOpenUserMenu = (event) => {
    setAnchorUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorUser(null);
  };

  const handleLogoClick = () => {
    if (!isChatSelectionNavigationDisabled) {
      navigate("/");
    }
  };

  const fetchGroupFileHistory = async (groupId) => {
    const history = await fetchFileHistory(accessToken, groupId);
    setFileHistory((prevHistory) => ({
      ...prevHistory,
      [groupId]: history,
    }));
  };

  useEffect(() => {
    if (openFileModal) {
      const currentGroupId = groups[activeTab].id;
      fetchGroupFileHistory(currentGroupId);
    }
  }, [openFileModal, activeTab, accessToken, groups]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const groupId = groups[newValue].id;
    fetchGroupFileHistory(groupId);
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    const groupId = groups[activeTab].id;
    if (selectedFile && groupId) {
      try {
        await uploadFile(accessToken, selectedFile, groupId);
        setSelectedFile(null);

        fetchGroupFileHistory(groupId);
      } catch (error) {
        console.error("Error al subir archivo:", error);
      }
    }
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "#F2F2F2" }}>
        <Container maxWidth="false">
          <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
            {!usebigLogo && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconButton
                  onClick={handleLogoClick}
                  sx={{ p: 0, marginLeft: { xs: "0", sm: "0", md: "15px" } }}
                  disabled={isChatSelectionNavigationDisabled}
                  aria-label="Logo AI Coach - Inicio"
                >
                  <img
                    src={`${process.env.PUBLIC_URL}/thomas_logo.png`}
                    alt="Logo AI Coach"
                    style={{ width: "148px", height: "31px", marginRight: "1rem" }}
                  />
                </IconButton>
              </Box>
            )}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="h6"
                noWrap
                sx={{ fontWeight: "700", color: "#303030", fontSize: { xs: "1.2rem", sm: "1.4rem" } }}
              >
                {groupName}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 0, padding: { xs: "0 5px 0 55px;", sm: "0 5px 0 55px;", md: "0 5px 0 103px;" } }}>
              <Tooltip title="Abrir configuración">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={user.name} src="/static/images/avatar/2.jpg" />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorUser}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                keepMounted
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                open={Boolean(anchorUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map((setting) => (
                  <MenuItem key={setting.text} onClick={handleCloseUserMenu}>
                    <Typography textAlign="center" onClick={setting.onClick}>
                      {setting.text}
                    </Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Toolbar>
        </Container>
        {usebigLogo && (
        <Box display="flex" justifyContent="center">
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton onClick={handleLogoClick} sx={{ p: 0 }} disabled={isChatSelectionNavigationDisabled}>
              <img
                src={`${process.env.PUBLIC_URL}/thomas_logo.png`}
                alt="Logo AI Coach"
                style={{ width: "345px", height: "73px" }}
              />
            </IconButton>
          </Box>
        </Box>
        )}
    </AppBar>

      {/* Modal for My Files */}
      <Modal open={openFileModal} onClose={() => setOpenFileModal(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Mis archivos
            </Typography>
            <IconButton onClick={() => setOpenFileModal(false)} aria-label="cerrar">
              <CloseIcon />
            </IconButton>
          </Box>

          <Tabs value={activeTab} onChange={handleTabChange} aria-label="Pestañas de grupo de usuario">
            {groups.map((group, index) => (
              <Tab key={group.id} label={group.name} />
            ))}
          </Tabs>

          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <input
              accept="application/pdf"
              id="upload-file"
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <label htmlFor="upload-file">
              <Button variant="outlined" component="span">
                Elegir archivo
              </Button>
            </label>
            <Typography
              variant="body2"
              sx={{
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedFile ? selectedFile.name : "Ningún archivo seleccionado"}
            </Typography>
            <Button variant="contained" onClick={handleFileUpload} disabled={!selectedFile}>
              Subir PDF
            </Button>
          </Box>

          <Typography variant="subtitle1" sx={{ mt: 3 }}>
            Subidas recientes para {groups[activeTab].name}
          </Typography>
          <List>
            {(fileHistory[groups[activeTab].id] || []).map((file, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={file.file_name}
                  secondary={`Subido el ${new Date(file.uploaded_at).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Modal>
    </>
  );
};

export default NavBar;
